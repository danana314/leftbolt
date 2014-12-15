// (on document ready)
$(function() {
    $("#startRoom").click(function(e) {
        $.ajax({
          url: '/newroom',
          type: 'POST',
          contentType: "application/json",
          async: true,
          success: function(data) {
            if (data.roomid) {
              window.location.href = "./r/"+data.roomid+"/1/";
            }
          }
        });
    });
});

$(window).scroll(function() {
    if ($(document).scrollTop() > 50) {
        $('nav').addClass('shrink');
    } else {
        $('nav').removeClass('shrink');
    }
});