import os
import re

def replace_imports(directory):
    patterns = [
        # Match types imports
        (re.compile(r"from\s+['\"](\.\.?\/)+types['\"]"), "from '@tgt/shared'"),
        (re.compile(r"from\s+['\"]@\/types['\"]"), "from '@tgt/shared'"),
        # Match supabase imports
        (re.compile(r"from\s+['\"](\.\.?\/)+(lib\/)?supabase['\"]"), "from '@tgt/shared'"),
        (re.compile(r"from\s+['\"]@\/(lib\/)?supabase['\"]"), "from '@tgt/shared'"),
    ]

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in patterns:
                    new_content = pattern.sub(replacement, new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")

if __name__ == "__main__":
    replace_imports("apps/web/src")
