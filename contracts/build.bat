@echo off
echo Building Soroban Escrow Contract...

cd escrow

REM Check if Rust is installed
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Rust is not installed. Please install it first:
    echo https://rustup.rs/
    exit /b 1
)

REM Check if wasm32 target is installed
rustup target list --installed | findstr "wasm32-unknown-unknown" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing wasm32-unknown-unknown target...
    rustup target add wasm32-unknown-unknown
)

REM Build the contract
echo Building contract...
cargo build --target wasm32-unknown-unknown --release

if %ERRORLEVEL% EQU 0 (
    echo Contract built successfully!
    echo WASM file: target\wasm32-unknown-unknown\release\escrow_contract.wasm
    echo.
    echo Next steps:
    echo 1. Deploy to testnet
    echo 2. Update contract ID in src\lib\soroban.ts
) else (
    echo Build failed
    exit /b 1
)
