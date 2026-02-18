import os
import re

def resolve_path(current_file_rel_to_src, rel_import):
    # current_file_rel_to_src: "pages/pro/DashboardPerfilPage.tsx"
    # rel_import: "../../contexts/CompanyContext"
    
    base_dir = os.path.dirname(current_file_rel_to_src)
    
    # Resolve the relative path
    # e.g. "pages/pro" + "../../contexts/CompanyContext"
    # os.path.join handles the ../ correctly in terms of logic if we treat it as path
    norm_path = os.path.normpath(os.path.join(base_dir, rel_import))
    
    # On Windows, normpath might use \. Always use / for imports.
    return norm_path.replace("\\", "/")

def fix_imports(src_dir):
    src_dir = os.path.abspath(src_dir)
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                abs_path = os.path.join(root, file)
                rel_file_path = os.path.relpath(abs_path, src_dir)
                
                with open(abs_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Regex for relative imports
                def replace_func(match):
                    quote = match.group(1)
                    rel_import = match.group(2)
                    
                    if rel_import.startswith('.'):
                        # Avoid replacing style imports or non-project imports if any
                        # But everything inside src should ideally be @/ if it's a sibling/descendant
                        resolved = resolve_path(rel_file_path, rel_import)
                        
                        # We only replace if we are NOT importing a CSS/SCSS file relatively (usually standard)
                        # but the user said @/components/... so let's check if it's one of the known dirs
                        # OR if it's a .tsx/.ts file.
                        
                        return f"from {quote}@/{resolved}{quote}"
                    
                    return match.group(0)

                new_content = re.sub(r"from\s+(['\"])(.+?)(\1)", replace_func, content)
                
                if new_content != original_content:
                    with open(abs_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Refactored: {rel_file_path}")

if __name__ == "__main__":
    target = "apps/web/src"
    print(f"Starting robust import refactor in {target}")
    fix_imports(target)
    print("Done!")
