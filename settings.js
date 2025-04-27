//  Buttons functionalities

document
  .getElementById("restart-button")
  .addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to restart? Any unsaved progress will be lost."
      )
    ) {
      window.location.reload();
    }
  });

document
  .getElementById("leaderboard-button")
  .addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to go to the leaderboard? Any unsaved progress will be lost."
      )
    ) {
      window.location.href = "leaderboard.html";
    }
  });

document.getElementById("quit-button").addEventListener("click", function () {
  if (
    confirm("Are you sure you want to quit? Any unsaved progress will be lost.")
  ) {
    window.location.href = "index.html";
  }
});
