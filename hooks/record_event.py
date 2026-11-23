#!/usr/bin/env python3
"""Ultra-lightweight passive lifecycle hook spooler for flight-recorder."""

import json
import os
import sys
import time
from pathlib import Path

MAX_USER_INPUT_CHARS = 500
MAX_ARG_STR_CHARS = 300
MAX_ARG_KEYS = 20


def compact_args(args):
    if args is None:
        return None, 0
    try:
        raw = json.dumps(args, ensure_ascii=False, separators=(",", ":"))
        arg_bytes = len(raw.encode("utf-8"))
    except Exception:
        return {"_unserializable": True}, 0

    if isinstance(args, dict):
        compacted = {}
        for i, (k, v) in enumerate(args.items()):
            if i >= MAX_ARG_KEYS:
                compacted["_truncatedKeys"] = len(args) - MAX_ARG_KEYS
                break
            if isinstance(v, str):
                compacted[k] = (
                    v[:MAX_ARG_STR_CHARS] + "..."
                    if len(v) > MAX_ARG_STR_CHARS
                    else v
                )
            elif isinstance(v, (int, float, bool)) or v is None:
                compacted[k] = v
            elif isinstance(v, list):
                compacted[k] = f"<list:{len(v)}>"
            elif isinstance(v, dict):
                compacted[k] = f"<dict:{len(v)}>"
            else:
                s = str(v)
                compacted[k] = (
                    s[:MAX_ARG_STR_CHARS] + "..."
                    if len(s) > MAX_ARG_STR_CHARS
                    else s
                )
        return compacted, arg_bytes

    if isinstance(args, str):
        val = (
            args[:MAX_ARG_STR_CHARS] + "..."
            if len(args) > MAX_ARG_STR_CHARS
            else args
        )
        return val, arg_bytes

    return str(args)[:MAX_ARG_STR_CHARS], arg_bytes


def main():
    try:
        raw_stdin = sys.stdin.read()
        if not raw_stdin.strip():
            return
        payload = json.loads(raw_stdin)
        if not isinstance(payload, dict):
            return

        data_dir = os.environ.get("PLUGIN_DATA") or str(
            Path.home() / ".gemini" / "flight-recorder-data"
        )
        out_dir = Path(data_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        events_path = out_dir / "events.jsonl"

        record = {
            "tsMs": int(time.time() * 1000),
            "hookEventName": payload.get("hookEventName"),
            "conversationId": payload.get("conversationId"),
            "workspacePaths": payload.get("workspacePaths"),
            "transcriptPath": payload.get("transcriptPath"),
            "artifactDirectoryPath": payload.get("artifactDirectoryPath"),
            "modelName": payload.get("modelName"),
            "cwd": payload.get("cwd"),
            "stepIdx": payload.get("stepIdx"),
            "invocationNum": payload.get("invocationNum"),
            "initialNumSteps": payload.get("initialNumSteps"),
            "executionNum": payload.get("executionNum"),
            "terminationReason": payload.get("terminationReason"),
            "fullyIdle": payload.get("fullyIdle"),
            "continuationActive": payload.get("continuationActive"),
            "error": payload.get("error"),
        }

        last_user = payload.get("lastUserInput")
        if isinstance(last_user, str) and last_user:
            record["lastUserInput"] = (
                last_user[:MAX_USER_INPUT_CHARS] + "..."
                if len(last_user) > MAX_USER_INPUT_CHARS
                else last_user
            )

        tool_call = payload.get("toolCall")
        if isinstance(tool_call, dict):
            compacted_args, arg_bytes = compact_args(tool_call.get("args"))
            record["toolCall"] = {
                "id": tool_call.get("id"),
                "name": tool_call.get("name"),
                "args": compacted_args,
                "argBytes": arg_bytes,
            }

        compact_record = {k: v for k, v in record.items() if v is not None}
        line = json.dumps(compact_record, ensure_ascii=False, separators=(",", ":"))
        with open(events_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        # Fail open so telemetry never disrupts an active chat.
        pass
    finally:
        sys.stdout.write("{}\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
