import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('"codechat" is now active!');

    const disposable = vscode.commands.registerCommand('codechat.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'codeChat',
            'Code Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';

                try {
                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'deepseek-r1:1.5b', //model 
                            prompt: userPrompt,
                            stream: false
                        })
                    });

                    const responseData = await response.json();
                    responseText = responseData.response;

                    panel.webview.postMessage({ command: 'chatResponse', text: responseText });

                } catch (error) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(error)}` });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: sans-serif; margin: 1rem }
            #prompt { width: 100%; box-sizing: border-box; }
            #response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem }
        </style>
    </head>
    <body>
        <h2>CodeChat Vs Code Extension</h2>
        <textarea id="prompt" rows="3" placeholder="Ask Here..."></textarea><br/>
        <button id="askBtn">Enter</button>
        <div id="response"></div>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('askBtn').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text });
            });

            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    document.getElementById('response').innerText = text;
                }
            });
        </script>
    </body>
    </html>
    `;
}

export function deactivate() {}
