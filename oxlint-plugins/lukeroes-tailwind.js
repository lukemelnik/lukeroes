const RAW_COLOR_PATTERN =
  /\b(?:text|bg|border|ring|outline|shadow|accent|caret|fill|stroke|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

const HW_PATTERN = /(?<![a-z-])h-(\d+(?:\.\d+)?)\b/;
const WH_PATTERN = /(?<![a-z-])w-(\d+(?:\.\d+)?)\b/;

function checkRawColors(node, context, value) {
  const match = value.match(RAW_COLOR_PATTERN);
  if (match) {
    context.report({
      node,
      message: `Do not use raw Tailwind color '${match[0]}'. Use semantic color classes instead (e.g., text-foreground, bg-card, text-destructive, border-border).`,
    });
  }
}

function checkSizeUtility(node, context, value) {
  const hMatch = value.match(HW_PATTERN);
  const wMatch = value.match(WH_PATTERN);

  if (hMatch && wMatch && hMatch[1] === wMatch[1]) {
    const size = hMatch[1];
    context.report({
      node,
      message: `Use 'size-${size}' instead of 'h-${size} w-${size}'.`,
    });
  }
}

const preferSizeUtility = {
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkSizeUtility(node, context, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (quasi.value && quasi.value.raw) {
            checkSizeUtility(node, context, quasi.value.raw);
          }
        }
      },
    };
  },
};

const noRawTailwindColors = {
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkRawColors(node, context, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (quasi.value && quasi.value.raw) {
            checkRawColors(node, context, quasi.value.raw);
          }
        }
      },
    };
  },
};

const plugin = {
  meta: {
    name: "lukeroes-tailwind",
  },
  rules: {
    "prefer-size-utility": preferSizeUtility,
    "no-raw-tailwind-colors": noRawTailwindColors,
  },
};

export default plugin;
