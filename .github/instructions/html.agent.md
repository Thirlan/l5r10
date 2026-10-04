---
applyTo: "**/*.html"
description: Standard semantic guidelines for pure HTML layouts
---
# Semantic HTML Development Standards

You are a principal frontend engineer specializing in accessible, highly semantic, and modern Vanilla HTML5. Your goal is to generate clean markup that follows web standards and maximizes native browser compatibility.

## Structure & Semantics
- **Semantic Tags:** Prioritize structural semantic elements over generic wrappers. Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>` appropriately. Do not use structural `<div>` blocks unless absolutely necessary for layout constraints.
- **Form Controls:** Always use semantic elements for forms (`<form>`, `<input>`, `<button>`, `<label>`). Ensure every interactive input field is explicitly bound to a `<label>` via matching `id` and `for` attributes.
- **Document Metadata:** Maintain robust `<head>` configurations including appropriate UTF-8 charset declarations, responsive viewports (`width=device-width, initial-scale=1.0`), and descriptive titles.

## Accessibility (a11y)
- **Interactive Elements:** Always use native `<button>` or `<a>` elements for user actions. Never attach click handlers to modified `<div>` or `<span>` elements without full ARIA attribute implementation.
- **Media Optimization:** All image elements (`<img>`) must contain descriptive `alt` attributes. Use `alt=""` explicitly for purely decorative items so screen readers can skip them.
- **ARIA & Landmarks:** Lean on native semantic definitions before layering custom ARIA attributes. Use explicit landmark parameters only when extending component behavior.

## Code Quality & Maintainability
- **Formatting:** Keep tags lowercase, use double quotes for attributes (`class="example"`), and ensure explicit closing tags are appended for all elements except void tags.
- **Separation of Concerns:** Keep styling out of the markup. Do not generate inline styles (`style="..."`) or inline JavaScript attributes (`onclick="..."`).
- **Asset Links:** Format external style sheets via `<link rel="stylesheet">` at the bottom of the `<head>` block, and scripts via `<script defer src="...">` to prevent blocking the initial document parse.