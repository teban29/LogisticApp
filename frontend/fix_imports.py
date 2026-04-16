import os

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                lines = f.readlines()
            
            new_lines = []
            for line in lines:
                # If we see import toast inside react-icons, remove it. But how to know?
                # Actually, there's a simpler text replacement we can do.
                pass
