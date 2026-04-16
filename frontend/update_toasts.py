import os
import re

toast_import = 'import toast from "react-hot-toast";\n'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If already processed, skip
    if 'import toast from "react-hot-toast";' in content:
        return

    # Check if there are any alert calls or if we should add success toasts
    changed = False

    # Replace alert()
    if 'alert(' in content:
        # custom replace for loading
        content = re.sub(r'const loadingAlert = alert\((.*?)\);', r'const loadingAlert = toast.loading(\1);', content)
        # custom replace for others
        content = re.sub(r'alert\("ATENCIÓN: Al modificar la carga, los códigos de barras de sus unidades han sido regenerados automáticamente.\\n\\nPor favor, RECUERDE IMPRIMIR NUEVAMENTE las etiquetas correspondientes."\);', r'toast("Los códigos han sido regenerados. Recuerde imprimir nuevamente las etiquetas.", { icon: "⚠️", duration: 6000 });', content)
        content = re.sub(r'alert\(', r'toast.error(', content)
        # remove loadingAlert.close() because toast uses toast.dismiss()
        content = re.sub(r'if \(loadingAlert\) loadingAlert\.close\(\);', r'if (loadingAlert) toast.dismiss(loadingAlert);', content)
        changed = True

    # Add success messages
    # For createCarga, createEnvio, createUser, etc.
    if 'await create' in content or 'await update' in content or 'await delete' in content or 'await generarUnidades' in content:
        # Let's just use a simple regex for the handleSubmit functions
        # For this, it's easier to manually insert toast.success in known places
        pass

    if changed:
        # Add import after the last import statement or at the top
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        
        lines.insert(last_import + 1, toast_import.strip())
        
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
        print(f"Updated alerts in {filepath}")

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
