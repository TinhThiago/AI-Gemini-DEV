"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

export default function HomePage() {
    const [file, setFile] = useState<File | null>(null);
    const [projectId, setProjectId] = useState("");
    const [files, setFiles] = useState<string[]>([]);
    const [prompt, setPrompt] = useState(
        "Review project này như senior developer, sửa bug quan trọng và tạo unit test/testcase tương ứng."
    );
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState("");
    const [diffs, setDiffs] = useState<any[]>([]);
    const [testCommand, setTestCommand] = useState("");
    const [testResult, setTestResult] = useState<any>(null);
    async function runTests() {
        if (!projectId) {
            alert("Upload project trước");
            return;
        }

        try {
            setLoading("Đang chạy tests...");
            setTestResult(null);

            const res = await fetch("/api/run-tests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    command: testCommand,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.error || "Chạy test thất bại");
                return;
            }

            setTestResult(data.result);
        } catch (err: any) {
            alert(err.message || "Lỗi khi chạy tests");
        } finally {
            setLoading("");
        }
    }
    async function loadDiff() {
        if (!projectId || !result) return;

        setLoading("Đang tạo diff...");

        try {
            const res = await fetch("/api/diff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    changes: result.changes || [],
                    tests: result.tests || [],
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.error || "Tạo diff thất bại");
                return;
            }

            setDiffs(data.diffs || []);
        } catch (err: any) {
            alert(err.message || "Lỗi tạo diff");
        } finally {
            setLoading("");
        }
    }
    async function uploadZip() {
        if (!file) {
            alert("Chọn file .zip trước");
            return;
        }

        try {
            setLoading("Đang upload file lớn lên Vercel Blob...");
            setProjectId("");
            setFiles([]);
            setResult(null);

            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/blob-upload",
                multipart: true,
                onUploadProgress: ({ loaded, total, percentage }) => {
                    console.log(`Upload progress: ${percentage}%`, loaded, total);
                    setLoading(`Đang upload file lớn lên Vercel Blob... ${percentage.toFixed(0)}%`);
                },
            });

            console.log("Blob uploaded:", blob);

            setLoading("Đã upload Blob, đang giải nén source...");

            const res = await fetch("/api/upload-from-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: blob.url,
                    filename: file.name,
                }),
            });

            const text = await res.text();

            let data: any;

            try {
                data = JSON.parse(text);
            } catch {
                console.error("Upload from URL raw response:", text);
                alert("API upload-from-url không trả JSON. Xem Console/Vercel Logs.");
                setLoading("");
                return;
            }

            console.log("Upload from URL response:", data);

            if (!res.ok || !data.ok) {
                alert(data.error || "Upload thất bại");
                setLoading("");
                return;
            }

            setProjectId(data.projectId);
            setFiles(data.files || []);

            alert("Upload thành công");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Upload lỗi");
        } finally {
            setLoading("");
        }
    }

    async function runAgent() {
        if (!projectId) {
            alert("Upload project trước");
            return;
        }

        try {
            setLoading("Gemini đang review code...");
            setResult(null);

            const res = await fetch("/api/agent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ projectId, prompt }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Gemini xử lý thất bại");
                return;
            }

            setResult(data.result);
            setDiffs([]);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Có lỗi khi gọi Gemini Agent");
        } finally {
            setLoading("");
        }
    }

    async function applyChanges() {
        if (!projectId || !result) return;

        setLoading("Đang ghi file...");

        const res = await fetch("/api/apply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                projectId,
                changes: result.changes || [],
                tests: result.tests || [],
            }),
        });

        const data = await res.json();

        setLoading("");

        if (!data.ok) {
            alert(data.error);
            return;
        }

        alert(data.message);
    }

    function downloadZip() {
        if (!projectId) return;
        window.location.href = `/api/download?projectId=${projectId}`;
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <header>
                    <h1 className="text-3xl font-bold">Gemini Senior Agent</h1>
                    <p className="text-neutral-400 mt-2">
                        Upload source ZIP → Gemini review/sửa code/tạo unit test → Apply → Download ZIP.
                    </p>
                </header>

                <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">1. Upload source code ZIP</h2>

                    <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-neutral-300"
                    />

                    <button
                        onClick={uploadZip}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
                    >
                        Upload ZIP
                    </button>

                    {projectId && (
                        <div className="text-sm text-green-400">
                            Project ID: {projectId}
                        </div>
                    )}
                </section>

                {files.length > 0 && (
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                        <h2 className="text-xl font-semibold mb-3">
                            2. Files đã scan ({files.length})
                        </h2>

                        <div className="max-h-64 overflow-auto bg-black rounded-lg p-3 text-sm">
                            {files.map((f) => (
                                <div key={f} className="text-neutral-300">
                                    {f}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">3. Yêu cầu Gemini xử lý</h2>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full min-h-36 bg-black border border-neutral-700 rounded-lg p-3 text-sm"
                    />

                    <button
                        onClick={runAgent}
                        disabled={!projectId}
                        className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                    >
                        Run Gemini Agent
                    </button>
                </section>

                {loading && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-200">
                        {loading}
                    </div>
                )}

                {result && (
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
                        <h2 className="text-xl font-semibold">4. Kết quả review</h2>

                        <div>
                            <h3 className="font-semibold text-green-400">Summary</h3>
                            <p className="text-neutral-300 mt-1">{result.summary}</p>
                        </div>

                        {result.selectedFiles?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-blue-400">Files Gemini đã đọc</h3>
                                <ul className="list-disc ml-5 text-sm text-neutral-300">
                                    {result.selectedFiles.map((f: string) => (
                                        <li key={f}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.issues?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-red-400">QA Review</h3>
                                <div className="space-y-3 mt-2">
                                    {result.issues.map((issue: any, i: number) => (
                                        <div key={i} className="bg-black rounded-lg p-3 text-sm">
                                            <div className="font-semibold">
                                                [{issue.severity}] {issue.file}
                                            </div>
                                            <div className="text-neutral-300">{issue.description}</div>
                                            <div className="text-neutral-400 mt-1">
                                                {issue.recommendation}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.changes?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-yellow-400">Files sẽ sửa</h3>
                                <div className="space-y-3 mt-2">
                                    {result.changes.map((change: any, i: number) => (
                                        <details key={i} className="bg-black rounded-lg p-3">
                                            <summary className="cursor-pointer">
                                                {change.file} — {change.reason}
                                            </summary>
                                            <pre className="mt-3 overflow-auto text-xs text-neutral-300">
                                                {change.content}
                                            </pre>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.tests?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-cyan-400">Unit Test / Testcase đề xuất</h3>
                                <div className="space-y-3 mt-2">
                                    {result.tests.map((test: any, i: number) => (
                                        <details key={i} className="bg-black rounded-lg p-3">
                                            <summary className="cursor-pointer">
                                                {test.file} — {test.type} — {test.description}
                                            </summary>
                                            <pre className="mt-3 overflow-auto text-xs text-neutral-300">
                                                {test.content}
                                            </pre>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.commands?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-purple-400">Lệnh test đề xuất</h3>
                                <pre className="bg-black rounded-lg p-3 text-sm">
                                    {result.commands.join("\n")}
                                </pre>
                            </div>
                        )}
                        <div className="bg-black rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-green-400">Run Tests</h3>

                            <input
                                value={testCommand}
                                onChange={(e) => setTestCommand(e.target.value)}
                                placeholder="Để trống để auto detect, hoặc nhập: npm test / npx vitest run / npx jest"
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm"
                            />

                            <button
                                onClick={runTests}
                                className="px-5 py-2 rounded-lg bg-green-700 hover:bg-green-600"
                            >
                                Run Tests
                            </button>
                        </div>
                        {testResult && (
                            <div className="bg-black rounded-lg border border-neutral-800 overflow-hidden">
                                <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800">
                                    <div className="font-semibold">
                                        Test Result:{" "}
                                        {testResult.code === 0 ? (
                                            <span className="text-green-400">PASSED</span>
                                        ) : (
                                            <span className="text-red-400">FAILED</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-neutral-400">
                                        Command: {testResult.command}
                                    </div>
                                </div>

                                <pre className="p-4 overflow-auto text-xs text-neutral-300 max-h-96">
                                    {testResult.stdout || ""}
                                    {testResult.stderr ? "\n\nSTDERR:\n" + testResult.stderr : ""}
                                </pre>
                            </div>
                        )}
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={loadDiff}
                                className="px-5 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500"
                            >
                                Preview Diff
                            </button>

                            <button
                                onClick={applyChanges}
                                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500"
                            >
                                Apply Changes + Tests
                            </button>
                            <button
                                onClick={runTests}
                                className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-600"
                            >
                                Run Tests
                            </button>
                            <button
                                onClick={downloadZip}
                                className="px-5 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600"
                            >
                                Download ZIP
                            </button>
                        </div>
                        {diffs.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-yellow-400">Diff Preview</h3>

                                {diffs.map((diff: any, index: number) => (
                                    <div key={index} className="bg-black rounded-lg border border-neutral-800 overflow-hidden">
                                        <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 font-semibold text-sm">
                                            {diff.file}
                                        </div>

                                        <pre className="p-4 overflow-auto text-xs leading-5">
                                            {diff.parts.map((part: any, i: number) => {
                                                const prefix = part.added ? "+ " : part.removed ? "- " : "  ";

                                                const className = part.added
                                                    ? "text-green-400"
                                                    : part.removed
                                                        ? "text-red-400"
                                                        : "text-neutral-400";

                                                return (
                                                    <span key={i} className={className}>
                                                        {part.value
                                                            .split("\n")
                                                            .map((line: string, lineIndex: number) =>
                                                                line === "" && lineIndex === part.value.split("\n").length - 1
                                                                    ? ""
                                                                    : `${prefix}${line}\n`
                                                            )
                                                            .join("")}
                                                    </span>
                                                );
                                            })}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}