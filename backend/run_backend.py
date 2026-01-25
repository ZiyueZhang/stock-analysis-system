import argparse
import os
import signal
import subprocess
import sys


def _iter_filtered_lines(stream):
    for line in stream:
        if "ANOMALY: meaningless REX prefix used" in line:
            continue
        yield line


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=int(os.getenv("BACKEND_PORT", "8000")))
    parser.add_argument("--reload", action="store_true", default=True)
    args = parser.parse_args()

    child_args = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--port",
        str(args.port),
    ]
    if args.reload:
        child_args.append("--reload")

    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    proc = subprocess.Popen(
        child_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
    )

    try:
        assert proc.stdout is not None
        for line in _iter_filtered_lines(proc.stdout):
            sys.stdout.write(line)
            sys.stdout.flush()
    except KeyboardInterrupt:
        pass
    finally:
        if proc.poll() is None:
            if os.name == "nt":
                try:
                    proc.send_signal(signal.CTRL_BREAK_EVENT)
                except Exception:
                    pass
            proc.terminate()
        try:
            return proc.wait(timeout=10)
        except Exception:
            proc.kill()
            return proc.wait()


if __name__ == "__main__":
    raise SystemExit(main())
