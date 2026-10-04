---
applyTo: "**/*.js"
---

# Pure JavaScript Development Standards

You are an expert software engineer specializing in modern Vanilla JavaScript (ES6+). Your goal is to generate clean, highly performing, framework-free code that runs natively in modern environments.

## Execution & Environment
- **Runtime Target:** Modern browsers and evergreen environments.
- **Module Architecture:** Always use **ECMAScript Modules (ESM)** syntax (`import`/`export`). Never use CommonJS (`require`/`module.exports`).
- **Feature Set:** Maximize modern native APIs (e.g., optional chaining `?.`, nullish coalescing `??`, object destructuring). Avoid relying on utility libraries like Lodash.

## Code Quality & Style
- **Variable Scoping:** Use `const` by default. Use `let` only if re-assignment is explicitly required. **Never** use `var`.
- **Function Syntax:** Use standard descriptive declarations (`function multiWordName() {}`) for top-level module functions. Use arrow functions `() => {}` strictly for anonymous callbacks and inline logic.
- **Strict Equality:** Always use `===` and `!==`. Never use weak comparison (`==` or `!=`).
- **DOM Manipulation:** Prefer `querySelector` and `querySelectorAll`. Always update elements efficiently using text properties (like `textContent`) or `classList` manipulations rather than parsing raw `innerHTML`.

## Asynchronous & Data Management
- **Flow Control:** Always use `async/await` syntax for handling promises.
- **Error Boundaries:** Wrap asynchronous tasks and network operations inside explicit `try...catch` blocks. Provide meaningful operational fallback behaviors.
- **Data Operations:** Leverage native array iteration methods (`.map()`, `.filter()`, `.reduce()`, `.forEach()`) rather than writing traditional raw `for` or `while` loops.

## Documentation & Types
- **Self-Documenting Code:** Write highly expressive, semantic variable names. Avoid injecting redundant inline comments that restate what the code executes.
- **JSDoc Types:** Every exported or public-facing function must include a structured JSDoc block defining input `@param` types and the expected `@returns` payload.

## Object Oriented Programming
- **Class Syntax:** Use ES6 `class` syntax for defining objects with methods and properties.
- **Encapsulation:** Keep internal state private using closures or the `#` private field syntax.
- **Inheritance:** Prefer composition over inheritance. Use `extends` only when there is a clear "is-a" relationship.
- **Method Binding:** Avoid binding methods in the constructor; use arrow functions for class fields when necessary.
- Keep class sizes manageable, ideally under 250 lines of code, to maintain readability and maintainability.
- **Single Responsibility Principle:** Each class should have a single responsibility or purpose, ensuring high cohesion and low coupling.

## Migration
Much of the code uses old formats, which will require migrations. 
- When migrating legacy JavaScript code, prioritize converting CommonJS modules to ESM syntax.
- Replace deprecated or non-standard APIs with modern native alternatives.