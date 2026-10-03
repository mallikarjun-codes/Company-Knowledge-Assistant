import subprocess
import sys
import time
import json
import urllib.request

def main():
    print("=== Phase 3: RAG Service Foundation Verification ===\n")

    # Start uvicorn server (single worker, async handles concurrency)
    print("Starting uvicorn server on port 8000...")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    print("Waiting 6 seconds for server startup...")
    time.sleep(6)

    # Check if server is still running
    if server_process.poll() is not None:
        stdout, stderr = server_process.communicate()
        print(f"Server exited early with code {server_process.returncode}")
        print(f"STDOUT: {stdout.decode()}")
        print(f"STDERR: {stderr.decode()}")
        sys.exit(1)

    passed = True

    try:
        # Test 1: Root endpoint
        print("--- Test 1: Root endpoint GET / ---")
        req = urllib.request.Request("http://127.0.0.1:8000/")
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            data = json.loads(resp.read().decode())
            if status == 200 and data.get("message") == "RAG Service is running":
                print(f"PASS: Status {status}, message: {data['message']}")
            else:
                print(f"FAIL: Status {status}, data: {data}")
                passed = False

        # Test 2: Health endpoint
        print("\n--- Test 2: Health endpoint GET /health ---")
        req = urllib.request.Request("http://127.0.0.1:8000/health")
        with urllib.request.urlopen(req, timeout=20) as resp:
            status = resp.status
            data = json.loads(resp.read().decode())
            if status == 200 and data.get("db_connection") == "successful":
                print(f"PASS: Status {status}, db_connection: {data['db_connection']}")
            else:
                print(f"FAIL: Status {status}, data: {data}")
                passed = False

    except Exception as e:
        print(f"ERROR: {e}")
        passed = False
    finally:
        print("\nKilling uvicorn server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()

    if passed:
        print("\n=== OVERALL RESULT: ALL TESTS PASSED ===")
        sys.exit(0)
    else:
        print("\n=== OVERALL RESULT: SOME TESTS FAILED ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
