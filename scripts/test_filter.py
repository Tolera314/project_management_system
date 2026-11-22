import subprocess

p = subprocess.Popen(['git', 'fast-export', '--all'], stdout=subprocess.PIPE)
count = 0
for line in p.stdout:
    if line.startswith(b'M ') or line.startswith(b'D '):
        parts = line.strip().split(b' ', 3 if line.startswith(b'M ') else 2)
        path = parts[-1].decode('utf-8', errors='ignore').strip('\"')
        if any(path.startswith(target) or path == target for target in ['backend/.env', 'frontend/.env', 'documents', 'deployment_guide.md', 'frontend/README.md']):
            print('MATCH:', line.strip())
            count += 1
            if count >= 10:
                break
p.kill()
print(f"Test completed. Total samples found: {count}")
