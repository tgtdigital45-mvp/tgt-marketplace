import json
import sys

def main():
    try:
        with open('audit_report.json', 'r', encoding='utf-16') as f:
            data = json.load(f)
            
        vulns = data.get('advisories', {})
        metadata = data.get('metadata', {})
        vulnerabilities = metadata.get('vulnerabilities', {})
        
        info = vulnerabilities.get('info', 0)
        low = vulnerabilities.get('low', 0)
        moderate = vulnerabilities.get('moderate', 0)
        high = vulnerabilities.get('high', 0)
        critical = vulnerabilities.get('critical', 0)
        total = info + low + moderate + high + critical
        
        with open('C:/Users/celso/.gemini/antigravity/brain/0a5ddc50-2072-4d0e-9164-4cff61ed6662/security_audit_report.md', 'w', encoding='utf-8') as out:
            out.write('# Relatório de Auditoria de Segurança (pnpm audit)\n\n')
            out.write(f'**Total de Vulnerabilidades Encontradas:** {total}\n\n')
            
            out.write('## Resumo por Severidade\n')
            out.write(f'- 🔴 **Crítica:** {critical}\n')
            out.write(f'- 🟠 **Alta:** {high}\n')
            out.write(f'- 🟡 **Moderada:** {moderate}\n')
            out.write(f'- 🟢 **Baixa:** {low}\n')
            out.write(f'- ⚪ **Info:** {info}\n\n')
            
            out.write('## Detalhes das Vulnerabilidades\n\n')
            
            if not vulns:
                out.write('Nenhuma vulnerabilidade detalhada encontrada.\n')
            else:
                for adv_id, adv in vulns.items():
                    title = adv.get('title', 'Sem título')
                    severity = adv.get('severity', 'unknown').upper()
                    module_name = adv.get('module_name', 'unknown')
                    vulnerable_versions = adv.get('vulnerable_versions', 'unknown')
                    patched_versions = adv.get('patched_versions', 'unknown')
                    recommendation = adv.get('recommendation', 'Nenhuma recomendação disponível.')
                    url = adv.get('url', '')
                    
                    out.write(f'### {module_name} ({severity})\n')
                    out.write(f'- **Título:** {title}\n')
                    out.write(f'- **Versões Vulneráveis:** {vulnerable_versions}\n')
                    out.write(f'- **Versões Corrigidas:** {patched_versions}\n')
                    out.write(f'- **Recomendação:** {recommendation}\n')
                    if url:
                        out.write(f'- **Mais informações:** [Link]({url})\n')
                    out.write('\n')
                    
        print("Report generated successfully.")
    except Exception as e:
        print(f"Error parsing audit report: {e}")

if __name__ == '__main__':
    main()
