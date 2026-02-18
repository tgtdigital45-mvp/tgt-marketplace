import os
import re

def fix_imports(directory):
    # Mapping of relative patterns to absolute @/ patterns
    # We look for patterns like ../components, ../../contexts, etc.
    # The regex matches: from '(.+)' or from "(.+)" where the path starts with .
    
    # We define what kind of paths should be converted to @/
    # If a path starts with ./ or ../ and contains one of our known folders, we convert it.
    
    folders = ['components', 'contexts', 'hooks', 'utils', 'services', 'pages', 'constants', 'lib', 'types', 'data']
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Regex for relative imports
                # Matches: from '../components/...' or from "./hooks/..."
                def replace_func(match):
                    quote = match.group(1)
                    rel_path = match.group(2)
                    
                    # If it's a relative path
                    if rel_path.startswith('.'):
                        # Split path components
                        parts = rel_path.split('/')
                        # Check if any part matches our known source folders
                        for i, part in enumerate(parts):
                            if part in folders:
                                # Construct new absolute path from that folder onwards
                                new_path = '@/' + '/'.join(parts[i:])
                                return f"from {quote}{new_path}{quote}"
                    
                    return match.group(0)

                # Execute replacement
                new_content = re.sub(r"from\s+(['\"])(.+?)(\1)", replace_func, content)
                
                if new_content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed imports in: {path}")

if __name__ == "__main__":
    target_dir = os.path.abspath("apps/web/src")
    print(f"Starting import refactor in {target_dir}")
    fix_imports(target_dir)
    print("Done!")
