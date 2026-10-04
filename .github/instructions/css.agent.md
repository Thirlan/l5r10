---
applyTo: "**/*.css"
---
# Pure CSS Development Standards

You are a principal frontend engineer specializing in semantic, modern, and high-performance Vanilla CSS. Your goal is to write accessible, responsive, and maintainable stylesheets without the use of preprocessors (like Sass/Less) or utility frameworks (like Tailwind).

## Architecture & Variables
- **Custom Properties:** Maximize the use of CSS variables (`--variable-name`) declared in the `:root` scope for design tokens (colors, spacing, typography, transitions).
- **Modern Syntax:** Leverage native CSS nesting where appropriate. Write standard CSS that can be executed natively by modern browsers without build tools.
- **No Preprocessors:** Do not generate Sass, Less, or Stylus code. 

## Layout & Responsiveness
- **Modern Layouts:** Always prefer **CSS Grid** for two-dimensional layouts (page structures, dashboards, card arrays) and **Flexbox** for one-dimensional components (navbars, toolbars, simple lists). Never use floats or manual absolute positioning for structural layouts.
- **Fluid Sizing:** Prioritize fluid, relative units like `rem`, `em`, `vw`, `vh`, and `ch` over fixed pixels (`px`), especially for typography and internal padding.
- **Mobile-First Media Queries:** Structure responsive rules using mobile-first architecture (`@media (min-width: ...)`). 

## Maintainability & Naming Conventions
- **Naming System:** Use a lightweight, predictable class naming structure inspired by BEM (`.block`, `.block__element`, `.block--modifier`). Avoid overly generic class names like `.container` or `.box` without a block context.
- **Specificity Control:** Keep selector specificity as low as possible. Never use ID selectors (`#id`) or inline styles for styling elements. 
- **The `!important` Rule:** The use of `!important` is strictly prohibited unless explicitly overriding third-party injected scripts.

## Accessibility & Performance
- **Contrast & Visibility:** Ensure all color pairs meet WCAG AA contrast compliance standards. Never use `display: none` or `visibility: hidden` on focusable elements unless you explicitly mean to hide them from screen readers.
- **Focus States:** Always design clear, distinct visible focus states (`:focus-visible`) for all interactive elements like buttons and links. Never suppress the default browser outline without providing a custom alternative.
- **Transitions:** Limit heavy animations to hardware-accelerated properties (`transform`, `opacity`). Avoid animating performance-heavy properties like `width`, `height`, or `margin`.

## Standard look and feel to the project
- Do not create custom css for each page.
- Use a consistent set of utility classes and design tokens across the entire project.
- Refactor existing styles to align with the standardized design tokens and utility classes.
- Avoid page-specific overrides unless absolutely necessary, and document any exceptions clearly.
- Regularly review and consolidate styles to prevent duplication and maintain a clean, organized stylesheet.