@echo off
echo =======================================================
echo SIH26024: AI-Based Coal Mine Governance System
echo Pushing committed full-stack codebase to GitHub:
echo https://github.com/sathvik210508/SIH26024-AI-coal-mine-governance-system.git
echo =======================================================
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo =======================================================
    echo SUCCESS! Codebase successfully pushed to GitHub!
    echo =======================================================
) else (
    echo =======================================================
    echo Push encountered an error or needs GitHub authentication.
    echo =======================================================
)
pause
