self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response("You are offline. please connect to the mathernet");
    })
  );
});
