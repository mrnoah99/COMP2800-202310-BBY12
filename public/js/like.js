$('.like-button').on('click', function() {
  var postId = $(this).data('id');
  var liked = $(this).hasClass('liked'); // Check if the post is already liked

  fetch(`/community/${postId}/like`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked: liked }) // Send the liked state to the server
  })
  .then((response) => response.json())
  .then((data) => {
      if (data.success) {
          // Update the like count on the button
          this.querySelector('.like-count').textContent = data.likeCount;

          // Toggle the liked state on the button
          $(this).toggleClass('liked');
      } else {
          console.error('Error:', data);
      }
  })
  .catch((error) => console.error('Error:', error));
});
