let remainingTime2 = 5316; 
let remainingTime3 = 31872;

// Function to update the timer
function updateTimer(buttonId, remainingTime) {
  const button = document.getElementById(buttonId);
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  button.innerText = timeString;
  remainingTime--;
  if (remainingTime < 0) {
    clearInterval(intervalId);
    button.disabled = false;
  }
}

// Call updateTimer with the correct button ID and remaining time for each button
const intervalId2 = setInterval(() => {
  updateTimer("event2_button", remainingTime2);
  remainingTime2--;
  if (remainingTime2 < 0) {
    clearInterval(intervalId2);
    const button = document.getElementById("event2_button");
    button.disabled = false;
  }
}, 1000);

const intervalId3 = setInterval(() => {
  updateTimer("event3_button", remainingTime3);
  remainingTime3--;
  if (remainingTime3 < 0) {
    clearInterval(intervalId3);
    const button = document.getElementById("event3_button");
    button.disabled = false;
  }
}, 1000);
