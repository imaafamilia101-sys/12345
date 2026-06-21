# ZIP MACRO v1

This folder contains the complete working ZIP MACRO intro that was active before BLACK LABEL.

## Restore

From the project root, run:

```powershell
Copy-Item animation-archive\zip-macro-v1\snapshot\redesign_home.py . -Force
Copy-Item animation-archive\zip-macro-v1\snapshot\source_app.js . -Force
Copy-Item animation-archive\zip-macro-v1\snapshot\source_styles.css . -Force
Copy-Item source_app.js assets\app.js -Force
Copy-Item source_styles.css assets\styles.css -Force
python redesign_home.py .
```

`zip-macro.css` and `intro-controller.js` are also included as isolated reference snippets.
