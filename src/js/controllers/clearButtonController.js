/* global $ App */
//references https://www.bootply.com/121508
$(document).ready(function(){
  $('#modalAddressInput').keyup(function(){
    $('#addressclear').toggle(Boolean($(this).val()));
  });
  $('#addressclear').toggle(Boolean($('#modalAddressInput').val()));
  $('#addressclear').click(function(){
    $('#modalAddressInput').val('').focus();
    $(this).hide();
  });
});

$(document).ready(function(){
  $('#modalSearchInput').keyup(function(){
    $('#searchclear').toggle(Boolean($(this).val()));
  });
  $('#searchclear').toggle(Boolean($('#modalSearchInput').val()));
  $('#searchclear').click(function(){
    $('#modalSearchInput').val('').focus();
    $(this).hide();
    App.controllers.modal.countChanged(App.models.serviceData.getData().length);
    App.controllers.modal.setCount(App.models.serviceData.getData().length);
  });
});
