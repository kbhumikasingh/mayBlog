async function generateSummary() {

  const text = document.getElementById("postInput").value;

  const response = await fetch("http://localhost:3000/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "Summarize this blog: " + text
    })
  });

  const data = await response.json();

  // SAFE PARSING
// SAFE PARSING
  if (data.result) {
    alert(data.result);
    return;
  }

  alert("No response from AI");

}