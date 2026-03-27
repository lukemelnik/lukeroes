const noUseeffectFormValues = {
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useEffect") {
          return;
        }

        if (node.arguments.length === 0) return;

        const callback = node.arguments[0];
        if (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression") {
          return;
        }

        const source = context.sourceCode.getText(callback);
        if (source.includes("setFieldValue") || source.includes("form.setFieldValue")) {
          context.report({
            node,
            message:
              "Do not use useEffect to set form values with setFieldValue. Use computed defaultValues instead.",
          });
        }
      },
    };
  },
};

const noUsestateModal = {
  create(context) {
    const modalComponents = ["Dialog", "AlertDialog", "Sheet", "Modal", "Drawer"];
    const safeComponents = [
      "Popover",
      "Command",
      "CommandDialog",
      "DropdownMenu",
      "Collapsible",
      "Tooltip",
      "HoverCard",
      "Select",
    ];

    function findFunctionScope(node) {
      let current = node.parent;
      while (current) {
        if (
          current.type === "FunctionDeclaration" ||
          current.type === "FunctionExpression" ||
          current.type === "ArrowFunctionExpression"
        ) {
          return current;
        }
        current = current.parent;
      }
      return null;
    }

    function findJsxUsage(scope, varName) {
      const source = context.sourceCode.getText(scope);
      for (const comp of modalComponents) {
        const pattern = new RegExp(`<${comp}[\\s\\n][^>]*\\bopen\\s*=\\s*\\{\\s*${varName}\\s*\\}`);
        if (pattern.test(source)) return comp;
      }
      for (const comp of safeComponents) {
        const pattern = new RegExp(`<${comp}[\\s\\n][^>]*\\bopen\\s*=\\s*\\{\\s*${varName}\\s*\\}`);
        if (pattern.test(source)) return null;
      }
      return undefined;
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useState") {
          return;
        }

        if (!node.parent || node.parent.type !== "VariableDeclarator") return;

        const declarator = node.parent;
        if (
          !declarator.id ||
          declarator.id.type !== "ArrayPattern" ||
          declarator.id.elements.length < 1
        ) {
          return;
        }

        const firstElement = declarator.id.elements[0];
        if (!firstElement || firstElement.type !== "Identifier") return;

        const varName = firstElement.name.toLowerCase();

        const explicitModalPatterns = [
          "ismodalopen",
          "issheetopen",
          "isdialogopen",
          "showmodal",
          "showsheet",
          "showdialog",
          "modalopen",
          "sheetopen",
          "dialogopen",
        ];

        if (explicitModalPatterns.some((pattern) => varName === pattern)) {
          context.report({
            node,
            message:
              "Do not use useState for modal/sheet/dialog open state. Use URL search params instead for deep linking and proper back button behavior.",
          });
          return;
        }

        if (varName === "open" || varName === "isopen") {
          const scope = findFunctionScope(node);
          if (!scope) return;

          const comp = findJsxUsage(scope, firstElement.name);
          if (comp) {
            context.report({
              node,
              message: `Do not use useState for ${comp} open state. Use URL search params instead for deep linking and proper back button behavior.`,
            });
          }
        }
      },
    };
  },
};

const noSuccessToast = {
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "toast" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "success"
        ) {
          context.report({
            node,
            message:
              "Avoid success toasts. The UI should visually confirm success (sheet closes, item appears, etc.). Use toast.error() for failures instead.",
          });
        }
      },
    };
  },
};

const preferSkipToken = {
  create(context) {
    const queryHooks = [
      "useQuery",
      "useSuspenseQuery",
      "useInfiniteQuery",
      "useSuspenseInfiniteQuery",
    ];

    return {
      Property(node) {
        if (
          node.key.type !== "Identifier" ||
          node.key.name !== "enabled" ||
          !node.parent ||
          node.parent.type !== "ObjectExpression"
        ) {
          return;
        }

        let current = node.parent.parent;
        while (current) {
          if (
            current.type === "CallExpression" &&
            current.callee.type === "Identifier" &&
            queryHooks.includes(current.callee.name)
          ) {
            context.report({
              node,
              message:
                "Use skipToken from @tanstack/react-query for conditional queries instead of the enabled option.",
            });
            return;
          }
          current = current.parent;
        }
      },
    };
  },
};

const requireFormFieldErrors = {
  create(context) {
    const textInputPattern = /<(?:Input|Textarea)\b/;

    function isFieldElement(jsxNode) {
      const o = jsxNode.openingElement;
      return o?.name?.type === "JSXMemberExpression" && o.name.property?.name === "Field";
    }

    function isNestedInFieldWithErrors(node) {
      let current = node.parent;
      while (current) {
        if (current.type === "JSXElement" && isFieldElement(current)) {
          const parentSource = context.sourceCode.getText(current);
          if (
            parentSource.includes("FieldError") ||
            parentSource.includes("meta.errors") ||
            parentSource.includes("meta.error")
          ) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (!opening || !opening.name) return;

        const name = opening.name;
        if (
          name.type !== "JSXMemberExpression" ||
          !name.property ||
          name.property.name !== "Field"
        ) {
          return;
        }

        const source = context.sourceCode.getText(node);

        if (!textInputPattern.test(source)) return;

        if (
          source.includes("FieldError") ||
          source.includes("meta.errors") ||
          source.includes("meta.error") ||
          source.includes("aria-invalid")
        ) {
          return;
        }

        if (isNestedInFieldWithErrors(node)) return;

        const nameAttr = opening.attributes.find(
          (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === "name",
        );
        let fieldName = "unknown";
        if (nameAttr?.value) {
          if (nameAttr.value.type === "Literal" || nameAttr.value.value) {
            fieldName = nameAttr.value.value;
          } else if (nameAttr.value.type === "JSXExpressionContainer") {
            fieldName = context.sourceCode.getText(nameAttr.value.expression);
          }
        }

        context.report({
          node: opening,
          message: `Form field "${fieldName}" is missing error display. Add <FieldError> or check field.state.meta.errors to show validation errors.`,
        });
      },
    };
  },
};

const plugin = {
  meta: {
    name: "lukeroes-react",
  },
  rules: {
    "no-useeffect-form-values": noUseeffectFormValues,
    "no-usestate-modal": noUsestateModal,
    "no-success-toast": noSuccessToast,
    "prefer-skip-token": preferSkipToken,
    "require-form-field-errors": requireFormFieldErrors,
  },
};

export default plugin;
