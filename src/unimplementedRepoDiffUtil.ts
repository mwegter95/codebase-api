// io.on("connection", (socket) => {
//     console.log("A client connected");

//     socket.on("start-comparison", async () => {
//         try {
//             const { stdout } = await exec(
//                 `git diff --name-only ${codebasePath} ${devTestPath}`
//             );
//             const filteredOutput = stdout
//                 .split("\n")
//                 .filter(
//                     (line) =>
//                         !line.includes(".git") &&
//                         !line.includes("node_modules") &&
//                         !line.includes("/dev/null")
//                 )
//                 .filter(Boolean); // Remove empty lines
//             const diffs = filteredOutput.map((file) => {
//                 return { id: file, content: file }; // Adjust based on how you want to represent this
//             });
//             socket.emit("diff-result", diffs);
//         } catch (error) {
//             console.error("Error generating diffs:", error);
//             socket.emit("error", "Failed to generate diffs");
//         }
//     });

//     socket.on("apply-selections", async (selectedDiffs) => {
//         console.log("Applying selected diffs:", selectedDiffs);
//         try {
//             for (const file of selectedDiffs) {
//                 const patchPath = `${codebasePath}/temp.patch`;
//                 const { stdout: patchContent } = await exec(
//                     `git diff ${codebasePath}/${file} ${devTestPath}/${file}`
//                 );
//                 await fs.writeFile(patchPath, patchContent);
//                 await exec(`git apply ${patchPath}`, { cwd: codebasePath });
//                 await fs.unlink(patchPath);
//             }
//             socket.emit(
//                 "apply-result",
//                 "Selected changes applied successfully"
//             );
//         } catch (error) {
//             console.error("Error applying selected diffs:", error);
//             socket.emit("error", "Failed to apply selected changes");
//         }
//     });

//     socket.on("disconnect", () => {
//         console.log("Client disconnected");
//     });
// });
