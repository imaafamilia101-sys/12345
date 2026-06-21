# BLACK LABEL v1

Complete snapshot of the BLACK LABEL intro before it was removed for faster shopping access.

## Restore

```powershell
Copy-Item animation-archive\black-label-v1\snapshot\redesign_home.py . -Force
Copy-Item animation-archive\black-label-v1\snapshot\source_app.js . -Force
Copy-Item animation-archive\black-label-v1\snapshot\source_styles.css . -Force
Copy-Item source_app.js assets\app.js -Force
Copy-Item source_styles.css assets\styles.css -Force
python redesign_home.py .
```
