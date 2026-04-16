import os
import re

toast_import = 'import toast from "react-hot-toast";\n'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    changed = False

    # Find the imports section
    has_toast_import = 'import toast from "react-hot-toast";' in content

    # Add success messages
    # For handleCreateSubmit, handleDelete, etc.
    replacements = [
        (r'(await createCarga\(.*?\);)', r'\1\n      toast.success("Carga creada exitosamente");'),
        (r'(await updateCarga\(.*?\);)', r'\1\n      toast.success("Carga actualizada exitosamente");'),
        (r'(await deleteCarga\(.*?\);)', r'\1\n      toast.success("Carga eliminada");'),
        (r'(await generarUnidades\(.*?\);)', r'\1\n      toast.success("Unidades generadas exitosamente");'),
        (r'(await createEnvio\(.*?\);)', r'\1\n      toast.success("Envío creado exitosamente");'),
        (r'(await updateEnvio\(.*?\);)', r'\1\n      toast.success("Envío actualizado exitosamente");'),
        (r'(await verifyEnvio\(.*?\);)', r'\1\n      toast.success("Envío verificado");'),
        (r'(await createUser\(.*?\);)', r'\1\n      toast.success("Usuario creado exitosamente");'),
        (r'(await updateUser\(.*?\);)', r'\1\n      toast.success("Usuario actualizado");'),
        (r'(await deleteUser\(.*?\);)', r'\1\n      toast.success("Usuario eliminado");'),
        (r'(await createClient\(.*?\);)', r'\1\n      toast.success("Cliente creado exitosamente");'),
        (r'(await updateClient\(.*?\);)', r'\1\n      toast.success("Cliente actualizado");'),
        (r'(await deleteClient\(.*?\);)', r'\1\n      toast.success("Cliente eliminado");'),
        (r'(await createProvider\(.*?\);)', r'\1\n      toast.success("Proveedor creado exitosamente");'),
        (r'(await updateProvider\(.*?\);)', r'\1\n      toast.success("Proveedor actualizado");'),
        (r'(await deleteProvider\(.*?\);)', r'\1\n      toast.success("Proveedor eliminado");'),
    ]

    for pattern, repl in replacements:
        if re.search(pattern, content) and "toast.success" not in re.search(pattern, content).group(0):
            # To ensure we don't duplicate, we replace only if not already followed by toast
            new_content = re.sub(pattern, repl, content)
            if new_content != content:
                content = new_content
                changed = True

    if changed:
        if not has_toast_import:
            lines = content.split('\n')
            last_import = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import = i
            lines.insert(last_import + 1, toast_import.strip())
            content = '\n'.join(lines)
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated success paths in {filepath}")

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
