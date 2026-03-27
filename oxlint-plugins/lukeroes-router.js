const noRedirectInLoader = {
  create(context) {
    return {
      ThrowStatement(node) {
        if (
          !node.argument ||
          node.argument.type !== "CallExpression" ||
          node.argument.callee.type !== "Identifier" ||
          node.argument.callee.name !== "redirect"
        ) {
          return;
        }

        let current = node.parent;
        while (current) {
          if (current.type === "Property" || current.type === "MethodDefinition") {
            const key = current.key;
            if (key && key.type === "Identifier" && key.name === "loader") {
              context.report({
                node,
                message:
                  "Do not throw redirect() inside a route loader. TanStack Router preloads routes on hover, which runs the loader. Put redirects in beforeLoad instead.",
              });
              return;
            }
            if (key && key.type === "Identifier" && key.name === "beforeLoad") {
              return;
            }
          }
          current = current.parent;
        }
      },
    };
  },
};

const plugin = {
  meta: {
    name: "lukeroes-router",
  },
  rules: {
    "no-redirect-in-loader": noRedirectInLoader,
  },
};

export default plugin;
