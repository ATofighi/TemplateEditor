$(document).ready(function () {
    ace.require('ace/ext/language_tools');

    var Editors = {}, edited = false, aceEditor = ace.edit('aceEditor');

    window.onbeforeunload = function (e) {
        if (edited)  return lang.youhaveunsavedthing;
    };

    $('#content').find('br').hide();

    aceEditor.setOptions({
        behavioursEnabled: true,
        enableBasicAutocompletion: true,
        theme: 'ace/theme/twilight'
    });

    aceEditor.commands.addCommand({
        readOnly: true,
        name: 'close',
        bindKey: {win: 'Alt-W', mac: 'Alt-W'},
        exec: function (editor) {
            $('.main_tabs li[template="' + editor.session.name + '"]').find('.main_tab_close').click()
        }
    });

    aceEditor.commands.addCommand({
        readOnly: true,
        name: 'save',
        bindKey: {win: 'Ctrl-S', mac: 'Control-S'},
        exec: function (editor) {
            Editors[editor.session.name].save(editor)
        }
    });

    aceEditor.resize();

    aceEditor.getSession().setUseWorker(false);
	
	function updateEditorTabsScroller() {
		var myWidth = 0;
		$('.main_tabs li').each(function() {
			myWidth += parseInt($(this).outerWidth());
		});
		$('.right_pane').data('menu-width', myWidth);
		if(parseInt($('.right_pane').width())-50 < myWidth)
		{
			$('#scrollerBtn').show();
			$('.main_tabs').width(myWidth+50);
		}
		else
		{
			$('#scrollerBtn').hide();
		}
		
		var allWidth = parseInt($('.right_pane').width()),
			menuWidth = parseInt($('.right_pane').data('menu-width'))+50,
			scrollLeft = parseInt($("#scrollerBtn").data('scroll'));
			
		if(typeof $("#scrollerBtn").data('scroll') == 'undefined')
			scrollLeft = 0;
				
		if(menuWidth-allWidth < scrollLeft) {
			scrollLeft = menuWidth-allWidth;
		}
		if(scrollLeft < 0) {
			scrollLeft = 0;
		}

		$("#scrollerBtn").data('scroll', scrollLeft);
		$(".main_tabs").css('left', scrollLeft);
	}
	
	var scrollTimeout = 0;

		$('#scrollerBtn span').click(function() {
		var allWidth = parseInt($('.right_pane').width()),
			menuWidth = parseInt($('.right_pane').data('menu-width'))+50,
			scrollLeft = parseInt($("#scrollerBtn").data('scroll')),
			addLeft = parseInt($(this).data('add'));

		if(typeof $("#scrollerBtn").data('scroll') == 'undefined')
			scrollLeft = 0;
		
		scrollLeft += addLeft;
		
		if(menuWidth-allWidth < scrollLeft) {
			scrollLeft = menuWidth-allWidth;
		}
		if(scrollLeft < 0) {
			scrollLeft = 0;
		}

		$("#scrollerBtn").data('scroll', scrollLeft);
		
		$(".main_tabs").css('left', scrollLeft);
	}).mousedown(function() {
		var allWidth = parseInt($('.right_pane').width()),
			menuWidth = parseInt($('.right_pane').data('menu-width'))+50,
			scrollLeft = parseInt($("#scrollerBtn").data('scroll')),
			addLeft = parseInt($(this).data('add'));

	    scrollTimeout = setInterval(function() {
			if(typeof $("#scrollerBtn").data('scroll') == 'undefined')
				scrollLeft = 0;
			
			scrollLeft += addLeft;
			
			if(menuWidth-allWidth < scrollLeft) {
				scrollLeft = menuWidth-allWidth;
			}
			if(scrollLeft < 0) {
				scrollLeft = 0;
			}

			$("#scrollerBtn").data('scroll', scrollLeft);
			
			$(".main_tabs").css('left', scrollLeft);
	    }, 100);
	}).bind('mouseup mouseleave', function() {
	    clearTimeout(scrollTimeout);
	});

    var Editor = function (Name, Sid, Tid, Editor) {
        this.name = Name;
        this.sid = Sid;
        this.tid = Tid;
        this.edited = 0; // Ace bug? Doesn't update the undo.
        this.editor = Editor;

        this.onEdit = function () {
        	// aceEditor.getSession().getUndoManager().isClean()
            edited = this.edited = (this.edited === 0 ? true : aceEditor.getSession().getUndoManager().hasUndo());
            return this.updateEdit();
        };

        this.updateEdit = function () {
            $('.main_tabs').find('li[template="' + this.name + '"] div').last().text(this.name + (this.edited ? ' *' : ''))
            return this;
        };

        this.show = function (elem) {
            if ($(elem).hasClass('in_use'))
                return this;

            aceEditor.setSession(this.editor);

            $('.main_tabs').find('li[class="in_use"]').removeClass('in_use');

            $(elem).addClass('in_use');
			
			updateEditorTabsScroller();

            return this.update();
        };

        this.update = function () {
            edited = false;

            $.each(Editors, function (key, value) {
                if (value.edited === true) {
                    edited = true;
                    return this;
                }
            });
			
			updateEditorTabsScroller();

            return this;
        }

        this.close = function (elem) {
            if (this.edited && !confirm(lang.youhaveunsavedthing))
                return this;

            $('.template[template=' + this.name + ']').removeClass('template_list_selected');

            parent = elem.parent()

            $e = parent.next().length != 0 ? parent.next() : parent.prev()

            delete Editors[this.name];

            if ($e.length == 0)
                $('#aceEditor').hide();

            if (parent.hasClass('in_use'))
                $e.click();

            elem.parent().remove();

            delete parent, elem
			
			updateEditorTabsScroller();

            return this.update();
        };

        this.save = function () {
            if (this.edited !== true) return;

            editor = this;

            jQuery.post('index.php?module=style-templates&action=edit_template&raw=1', {
                	my_post_key: my_post_key,
                    title: this.name,
                    tid: this.tid,
                    sid: this.sid,
                    template: editor.editor.getValue(),
                    continue: lang.saveAndContinueEditing
			}, function(data) {
                    if (data.msg === undefined) 
            			return alert(lang.couldNotSave);

                    edited = editor.edited = false;
                    editor.update().updateEdit();
                    $('.saved').stop().clearQueue().fadeIn('slow').delay('700').fadeOut('slow')
					updateEditorTabsScroller();
            }, 'json').fail(function() {
            	alert(lang.couldNotSave)
            })
        };
    };

    $('.search').on('keyup', function (e) {
        if ($('.search').val().trim() == '') {
			$('.template_li').removeClass('template_li_opened');
            $('.template_item').hide().parent().parent().show();
        } else {
            $('.template_li,.template_item').hide();
            $('.template_li').removeClass('template_li_opened');

            $('.template_item[template*="' + $('.search').val().trim() + '"]').each(function () {
                $(this).show().parent().parent().show().addClass('template_li_opened');
            });
        }
    });

    $('.template_list').find('li.template_li:has(ul)').on('click', function (e) {
        if (!$(e.target).is('.template, .template_parent')) 
            $(this).find(' > ul > li' + ($('.search').val().trim() == '' ? '' : '[template *= "' + $('.search').val().trim() + '"]')).toggle().parents('.template_li').toggleClass('template_li_opened');
    });

    $('.template').click(function (e) {
        if (Editors[$(this).attr('template')] !== undefined) {
            $('.main_tabs').find('li[template=' + $(this).attr('template') + ']').click()
        } else {
            $.getJSON('index.php?module=style-editor', {
                'title': $(this).attr('template'),
                'sid': sid,
                'action': 'get_template'
            }, function (data) {
                $('.main_tabs').find('li[class="in_use"]').removeClass('in_use');

                Editors[data.title] = new Editor(data.title, data.sid, data.tid, ace.createEditSession(data.template, 'ace/mode/php'));

                Editors[data.title].editor.on('change', function () {
                    Editors[data.title].onEdit();
                });

                Editors[data.title].editor.name = data.title

                aceEditor.setSession(Editors[data.title].editor);

                $('#aceEditor').show();

                $('.main_tabs').append($('<li/>').attr('class', 'in_use').attr('test', data.title).attr('template', data.title)
                    .append($('<div/>').attr('template', data.title).addClass('main_tab_close').html('&#61453;')).append($('<div/>').addClass('main_tab').text(data.title)));

                $(e.target).addClass('template_list_selected')
				
				
            });
        }
		
		updateEditorTabsScroller();
		
		setTimeout(updateEditorTabsScroller, 100);

    });

    $('.main_tabs').on('mousedown', 'li', function (e) {
        if (e.which === 2)
            return $(this).find('.main_tab_close').click()

		updateEditorTabsScroller();
    })

    $('.main_tabs').on('click', 'li', function (e) {
        if ($(e.target).attr('class') == 'main_tab_close')
            Editors[$(this).attr('template')].close($(e.target));
        else
            Editors[$(this).attr('template')].show(this);

		updateEditorTabsScroller();
    });

    $('.save').click(function (e) {
        Editors[$('.main_tabs').find('li[class="in_use"]').attr('template')].save()
		updateEditorTabsScroller();
    });
})
