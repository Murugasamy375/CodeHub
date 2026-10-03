import asyncio
import logging
import os
import subprocess
import tempfile
import time


logger = logging.getLogger(
    "codehub.execution"
)


TIMEOUT_SECONDS = 5


MAX_OUTPUT_SIZE = 100_000


SUPPORTED_LANGUAGES = {
    "python",
    "java",
}


def _execute_code_sync(
    language,
    code,
    stdin,
):

    start_time = time.perf_counter()


    with tempfile.TemporaryDirectory() as temp_dir:

        if language == "python":

            source_file = os.path.join(
                temp_dir,
                "main.py",
            )

            with open(
                source_file,
                "w",
                encoding="utf-8",
            ) as file:

                file.write(code)


            command = [
                "python",
                source_file,
            ]


        elif language == "java":

            source_file = os.path.join(
                temp_dir,
                "Main.java",
            )

            with open(
                source_file,
                "w",
                encoding="utf-8",
            ) as file:

                file.write(code)


            compile_result = subprocess.run(
                [
                    "javac",
                    source_file,
                ],
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
                cwd=temp_dir,
            )


            if compile_result.returncode != 0:

                execution_time = (
                    time.perf_counter()
                    - start_time
                )

                return {
                    "status": "error",
                    "output": "",
                    "error":
                        compile_result.stderr[
                            :MAX_OUTPUT_SIZE
                        ],
                    "execution_time":
                        round(
                            execution_time,
                            4,
                        ),
                }


            command = [
                "java",
                "-cp",
                temp_dir,
                "Main",
            ]


        else:

            logger.warning(
                "CODE_EXECUTION_REJECTED language=%s",
                language,
            )

            return {
                "status": "error",
                "output": "",
                "error":
                    f"Unsupported language: {language}",
                "execution_time": 0,
            }


        logger.info(
            "SANDBOX_EXECUTION_STARTED language=%s code_size=%d",
            language,
            len(code),
        )


        try:

            result = subprocess.run(
                command,
                input=stdin,
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
                cwd=temp_dir,
            )


            execution_time = (
                time.perf_counter()
                - start_time
            )


            output = (
                result.stdout or ""
            )[:MAX_OUTPUT_SIZE]


            error = (
                result.stderr or ""
            )[:MAX_OUTPUT_SIZE]


            if result.returncode != 0:

                status = "error"

            else:

                status = "success"


            logger.info(
                "SANDBOX_EXECUTION_COMPLETED "
                "language=%s execution_time=%.4f status=%s",
                language,
                execution_time,
                status,
            )


            return {
                "status": status,
                "output": output,
                "error": error,
                "execution_time":
                    round(
                        execution_time,
                        4,
                    ),
            }


        except subprocess.TimeoutExpired:

            execution_time = (
                time.perf_counter()
                - start_time
            )


            logger.warning(
                "CODE_EXECUTION_TIMEOUT "
                "language=%s execution_time=%.4f",
                language,
                execution_time,
            )


            return {
                "status": "timeout",
                "output": "",
                "error":
                    "Code execution timed out.",
                "execution_time":
                    round(
                        execution_time,
                        4,
                    ),
            }


async def execute_code(
    language,
    code,
    stdin,
):

    language = language.lower().strip()


    if language not in SUPPORTED_LANGUAGES:

        logger.warning(
            "CODE_EXECUTION_REJECTED language=%s",
            language,
        )

        return {
            "status": "error",
            "output": "",
            "error":
                f"Unsupported language: {language}",
            "execution_time": 0,
        }


    return await asyncio.to_thread(
        _execute_code_sync,
        language,
        code,
        stdin,
    )