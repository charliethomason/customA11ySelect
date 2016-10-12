(function($) {
  $.fn.customA11ySelect = function(params) {

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Silk|Opera Mini/i.test(navigator.userAgent);
    var keyTimeout;
    var keyMap = '';
    var down = 40;
    var up = 38;
    var spacebar = 32;
    var enter = 13;
    var escape = 27;
    var pageUp = 33;
    var pageDown = 34;
    var endKey = 35;
    var homeKey = 36;
    var tabKey = 9;

    return this.each(function() {

      var $menu = $(this); // the original <select> element
      var menuID = $menu.attr('id'); // ID of the original <select> input

      // creates the dropdown menu
      function menuConstructor() {

        var $label = $('label[for="'+menuID+'"]');
        $label.attr('id',menuID+'-label');

        // create the new custom-selectmenu HTML
        var selectMenu = $('<div class="custom-selectmenu-container">');
        buildMenu(selectMenu);
      }

      function setParams(list) {
        // if overlay parameter is defined, set overlay scroll on dropdown menu
        if (params.overlay) {
          var overlaySize = params.overlay+'px';
          list.addClass('custom-selectmenu-overflow').css('max-height',overlaySize);
        }
      }

      function buildMenu(selectMenu) {

        // put all <option>'s in an array
        var options = new Array;
        $menu.find('option').each(function() {
          options.push($(this));
        });

        var button = $('<button type="button" id="'+menuID+'-button" class="custom-selectmenu-btn" aria-expanded="false" aria-haspopup="true"><span class="custom-selectmenu-text" id="'+menuID+'-selected"></span><i class="custom-selectmenu-icon icon-carrat-down"></i></button>');
        var list = $('<ul class="custom-selectmenu-menu" id="'+menuID+'-menu" role="menu">');

        // create each option <li> for the custom-selectmenu
        for (i=0;i<options.length;i++) {
          // add an image to the option text if the data-iconurl attribute is present
          var optionText = (options[i].attr('data-iconurl')) ? '<i class="custom-selectoption-img" style="background-image:url('+options[i].attr('data-iconurl')+')"> </i>'+options[i].text() : options[i].text();
          // if the current option is selected
          if (options[i].is(':selected')) {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-selectmenu-option custom-selectoption-focused custom-selectoption-selected" data-val="'+options[i].val()+'"><button type="button" role="menuitem">'+optionText+'</button></li>');
            button.attr('aria-labelledby',menuID+'-selected '+menuID+'-label').attr('aria-activedescendant','custom-selectoption-'+i);
            button.find('.custom-selectmenu-text').text(options[i].text());
          // if the current option is disabled
          } else if (options[i].is(':disabled')) {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-selectmenu-option custom-selectoption-disabled" data-val="'+options[i].val()+'" aria-disabled="true"><button type="button" role="menuitem">'+optionText+'</button></li>');
          // normal options
          } else {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-selectmenu-option" data-val="'+options[i].val()+'"><button type="button" role="menuitem">'+optionText+'</button></li>');
          }
        }
        // if there are more than 5 options, set an overflow class
        if (options.length > 5) {
          list.addClass('custom-selectmenu-overflow');
        }

        selectMenu.append(button,list); // append the button and option list to the custom-selectmenu-container

        if (!$menu.is('[data-custom-selectmenu]')) {
          $menu.after(selectMenu); // insert the custom-selectmenu after the original <select> element
          $menu.attr('data-custom-selectmenu',menuID+'-menu'); // apply data attribute to original select element
        }

        // if on mobile or tablet, use native mobile OS select controls by inserting original <select> inside button
        if (isMobile) {
          $menu.appendTo(selectMenu).addClass('custom-selectmenu-mobile');
          list.addClass('custom-selectmenu-hidden');
          mobileEventHandlers(button,$menu);
        // if on desktop, hide original <select>
        } else {
          $menu.hide();
          eventHandlers(selectMenu); // set eventHandlers for this custom-selectmenu
          // if special parameters are defined
          if (typeof params != 'undefined') {
            setParams(list);
          }
        }
      }

      // refresh options within an existing custom select menu
      function refreshOptions() {
        var selectMenu = $('#'+$menu.attr('data-custom-selectmenu')).parent('.custom-selectmenu-container');
        selectMenu.find('.custom-selectmenu-btn, .custom-selectmenu-menu').remove(); // remove the existing button and dropdown list
        buildMenu(selectMenu);
      }

      // if the select does not already have a custom select menu applied
      if (!$menu.is('[data-custom-selectmenu]')) {
        menuConstructor();
      }

      // if the select already has a custom select menu AND the 'refresh' parameter is passed AND it's not a mobile device
      // if the select already has a custom select menu AND the 'refresh' parameter is passed
      if ($menu.is('[data-custom-selectmenu]') && params == 'refresh') {
        // if mobile, then only update the button text
        if (isMobile) {
          var $btn = $('button#'+menuID+'-button');
          var valText = $menu.find('option:selected').text();
          $btn.find('.custom-selectmenu-text').text(valText);
        // if not mobile, then rebuild the select dropdown
        } else {
          refreshOptions();
        }
    }
    });

    function eventHandlers(selectMenu) {
      var $button = selectMenu.find('.custom-selectmenu-btn');
      var $option = selectMenu.find('.custom-selectmenu-option > button');
      var $original = selectMenu.prev('select');

      // clicking the menu button opens/closes the dropdown
      $button.on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        // if the keyMap variable from the keySearch function is empty, toggle the dropdown
        if (keyMap == '') {
          toggleDropdown($(this));
          $(this).siblings('.custom-selectmenu-menu').find('.custom-selectoption-focused > button').trigger('focus');
        }
      });

      // key event handlers for the main dropdown button
      $button.on('keydown',function(e) {
        var $dropdown = $(this).siblings('.custom-selectmenu-menu');
        switch(e.keyCode) {
          // escape key closes the dropdown
          case escape:
            e.preventDefault();
            closeDropdown($dropdown);
            break;
          // up and down arrow keys open/close the dropdown
          case up:
          case down:
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown($(this));
            $(this).siblings('.custom-selectmenu-menu').find('.custom-selectoption-focused > button').trigger('focus');
            break;
        }
      });

      // Keypress event handlers to support searching for select options by typing in option text
      $button.on('keypress',function(e) {
        var keyp = e.keyCode;
        var dropdown = $(this).siblings('.custom-selectmenu-menu');
        keySearch(keyp,dropdown);
      });
      $option.on('keypress',function(e) {
        var keyp = e.keyCode;
        var dropdown = $(this).parents('.custom-selectmenu-menu');
        keySearch(keyp,dropdown);
      });

      // key event handlers for option buttons within the dropdown
      $option.on('keydown',function(e) {
        var $li = $(this).parent('.custom-selectmenu-option');
        switch(e.keyCode) {
          // up arrow key focuses to previous option
          case up:
            e.preventDefault();
            e.stopPropagation();
            $li.prev('.custom-selectmenu-option').children('button').trigger('focus');
            break;
          // down arrow key focuses on next option
          case down:
            e.preventDefault();
            e.stopPropagation();
            $li.next('.custom-selectmenu-option').children('button').trigger('focus');
            break;
          // page up and home keys focus on first option
          case pageUp:
          case homeKey:
            e.preventDefault();
            e.stopPropagation();
            $li.siblings('.custom-selectmenu-option:first').children('button').trigger('focus');
            break;
          // page down and end keys focus on last option
          case pageDown:
          case endKey:
            e.preventDefault();
            e.stopPropagation();
            $li.siblings('.custom-selectmenu-option:last').children('button').trigger('focus');
            break;
          // tab key is disabled when focused on any option
          case tabKey:
            e.preventDefault();
            break;
        }
      });

      // hover & focus on menu options toggles active/hover state
      $option.on('mouseover focus',function(e) {
        var $dropdown = $(this).parents('.custom-selectmenu-menu');
        $dropdown.find('.custom-selectmenu-option.custom-selectoption-focused').removeClass('custom-selectoption-focused');
        $(this).parent('.custom-selectmenu-option').addClass('custom-selectoption-focused');
        $dropdown.siblings('.custom-selectmenu-btn').attr('aria-activedescendant',$(this).attr('id'));
      });

      // clicking on menu option sets option as selected
      $option.on('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $li = $(this).parent('.custom-selectmenu-option');
        if (!$li.hasClass('custom-selectoption-disabled')) {
          selectOption($li, true);
          // if the keyMap variable from the keySearch function is empty, close the dropdown
          if (keyMap == '') {
            closeDropdown($(this).parents('.custom-selectmenu-menu'));
          }
        }
      });

      // clicking outside the dropdown closes it
      $('body').on('click',function() {
        closeDropdown();
      });
      // if the original/hidden <select> value is changed, update the selected option in the custom select
      $original.change(function() {
        var selectedOptionIndex = $(this).find('option:selected').index();
        var customSelectedOption = selectMenu.find('.custom-selectmenu-option').eq(selectedOptionIndex);
        selectOption(customSelectedOption, false);
      });
    }

    // Search for select options matching a string of characters typed while focused on the element
    function keySearch(keyp,dropdown) {
      var $options = dropdown.find('.custom-selectmenu-option');
      var $currOption = dropdown.find('.custom-selectoption-selected');

      if (keyp !== down &&
          keyp !== up &&
          keyp !== enter &&
          keyp !== escape &&
          keyp !== pageUp &&
          keyp !== pageDown &&
          keyp !== homeKey &&
          keyp !== endKey &&
          keyp !== tabKey) {

        var character = String.fromCharCode(keyp).toLowerCase();

        // if the first key is spacebar and keyMap is empty, don't do anything (to prevent conflict with click event)
        if (keyp == spacebar && keyMap == '') {
          return;
        }
        
        if (keyMap === '') {
          keyMap = character;
        } else {
          keyMap += character;
        }

        // timeout to wait until user has finished typing to check for option matching keyMap string
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(function() {

          keyMap = keyMap.trim();

          var $nextOpt = $currOption.nextAll('.custom-selectmenu-option').filter(function() {
            return $(this).text().toLowerCase().indexOf(keyMap) == 0;
          });

          // if one of the options after the currently-selected option is a match, select it
          if ($nextOpt.length) {
            selectOption($nextOpt.first(), true);
            // close the dropdown if a match is found
            if ($nextOpt.first().length) {
              closeDropdown(dropdown);
            }
          // otherwise, check all of the options for a match
          } else {
            var $theOption = $options.filter(function() {
              return $(this).text().toLowerCase().indexOf(keyMap) == 0;
            });
            selectOption($theOption.first(), true);
            // close the dropdown if a match is found
            if ($theOption.first().length) {
              closeDropdown(dropdown);
            }
          }

          // reset keyMap to empty string
          keyMap = '';
        }, 300);

      }
    }

    // mobile-specific event handlers
    function mobileEventHandlers($button,$menu) {
      // changing the selected option in the native mobile OS controls updates the custom button text
      $menu.on('change',function() {
        var selectedText = $(this).find(':selected').text();
        $button.find('.custom-selectmenu-text').text(selectedText);
      });
    }
   $button.on('click',function(e) {
    e.preventDefault();
    $menu.trigger('focus');
    });
    // sets a menu option to be selected
    function selectOption($option, updateOriginal) {
      var selectedOption = $option.attr('data-val');
      var optionID = $option.attr('id');
      var optionText = $option.text();
      var $dropdown = $option.parents('.custom-selectmenu-menu');
      var $button = $dropdown.siblings('.custom-selectmenu-btn');
      var $original = $option.parents('.custom-selectmenu-container').prev('select');
      $dropdown.find('.custom-selectmenu-option.custom-selectoption-selected').removeClass('custom-selectoption-selected custom-selectoption-focused');
      $option.addClass('custom-selectoption-focused custom-selectoption-selected');
      $button.attr('aria-activedescendant',optionID);
      $button.find('.custom-selectmenu-text').text(optionText);
      if (updateOriginal) {
        $original.val(selectedOption).change();
      }
    }
    // opens/closes the dropdown
    function toggleDropdown($button) {
      var $dropdown = $button.siblings('.custom-selectmenu-menu');
      var $icon = $button.children('.custom-selectmenu-icon');
      $('.custom-selectmenu-menu').not($dropdown).removeClass('opened');
      if ($dropdown.hasClass('opened')) {
        $button.attr('aria-expanded','false');
      } else {
        $button.attr('aria-expanded','true');
        // if select button is scrolled more than halfway down page, open on top of button, not below
        if (!isMobile) {
          var scrollTop = $(window).scrollTop();
          var topOffset = $button.offset().top;
          var relativeOffset = topOffset-scrollTop;
          var winHeight = $(window).height();
          if (relativeOffset > winHeight/2) {
            $dropdown.addClass('custom-selectmenu-reversed');
          } else {
            $dropdown.removeClass('custom-selectmenu-reversed');
          }
        }
      }
      $icon.toggleClass('icon-carrat-down').toggleClass('icon-carrat-up');
      $dropdown.toggleClass('opened');
      // if dropdown has overflow, scroll to the selected option
      if ($dropdown.hasClass('custom-selectmenu-overflow') && !isMobile) {
        var $selectedOption = $dropdown.find('.custom-selectoption-selected').index();
        if ($selectedOption > 0) {
          var selectedScrollPos = ($selectedOption * 40) + 16; // each option is ~40px tall, with 16px top padding on dropdown
          $dropdown.scrollTop(selectedScrollPos);
        }
      }
    }
    // closes the dropdown
    function closeDropdown($menu) {
      var $openMenu = ($menu) ? $menu : $('.custom-selectmenu-menu.opened');
      var $button = $openMenu.siblings('.custom-selectmenu-btn');
      var $icon = $button.children('.custom-selectmenu-icon');
      var $currentlySelected = $openMenu.find('.custom-selectoption-selected');
      $openMenu.find('.custom-selectmenu-option.custom-selectoption-focused').removeClass('custom-selectoption-focused');
      $openMenu.find('.custom-selectoption-selected').addClass('custom-selectoption-focused');
      $button.attr('aria-activedescendant',$currentlySelected.attr('id'));
      $button.find('.custom-selectmenu-text').text($currentlySelected.text());
      $icon.removeClass('icon-carrat-up').addClass('icon-carrat-down');
      $button.trigger('focus').attr('aria-expanded','false');
      $openMenu.removeClass('opened');
    }

  };
  $.fn.customA11ySelect.closeAllDropdowns = function() {
    if ($('.custom-selectmenu-menu.opened').length) {
      var $openMenu = $('.custom-selectmenu-menu.opened');
      var $button = $openMenu.siblings('.custom-selectmenu-btn');
      var $icon = $button.children('.custom-selectmenu-icon');
      var $currentlySelected = $openMenu.find('.custom-selectoption-selected');

      $openMenu.find('.custom-selectmenu-option.custom-selectoption-focused').removeClass('custom-selectoption-focused');
      $openMenu.find('.custom-selectoption-selected').addClass('custom-selectoption-focused');
      $button.attr('aria-activedescendant',$currentlySelected.attr('id'));
      $button.find('.custom-selectmenu-text').text($currentlySelected.text());
      $icon.removeClass('icon-carrat-up').addClass('icon-carrat-down');
      $button.attr('aria-expanded','false');
      $openMenu.removeClass('opened');
    }
  };
})(jQuery);