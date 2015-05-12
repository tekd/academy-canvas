$(document).ready(function() {
    var db = null;

    if (location.hostname == 'govlabacademy.org') {
        if (location.pathname == '/canvas/') {
            db = new Firebase('https://lean-canvas.firebaseio.com/');

        } else if (location.pathname == '/public-canvas/') {
            db = new Firebase('https://lean-canvas-public.firebaseio.com/');
        }

    } else {
        db = new Firebase('https://lean-canvas-dev.firebaseio.com/');
    }

    state0(db);

    $(document).foundation();

    window.onpopstate = function(event) { state0(db); };

    $('.b-project-list').on('click', '.e-project-list-item span', function() {
        var id = slugy($(this).text());

        if ($(this).hasClass('locked')) {
            $('#unlock-canvas').foundation('reveal', 'open');
            $('#unlock-canvas form').data('id', id);

        } else {
            state2(db, id);
        }

        return false;
    });

    $('#unlock-canvas form').submit(function(event) {
        var id = $(this).data('id'),
            pwd = $(this).find('input').val();

        event.preventDefault();

        db.authWithPassword({email: id + '@example.com', password: pwd},
            function(error, authData) {
                if (!error) {
                    $('#unlock-canvas').foundation('reveal', 'close');
                    state2(db, id);

                } else {
                    notify('error', 'Wrong password');
                }

            }, {remember: 'none'}
        );

        return false;
    });

    $('.e-add-comment').click(function() {
        $(this).addClass('m-display-none');
        $(this).siblings('.e-canvas-comment').removeClass('m-display-none');
    });

    $('.b-create-canvas').submit(function(event) {
        function create_canvas(db, id, uid) {
            function set_data(name) {
                doc[name] = '';
                doc[name + '_timestamp'] = '';
                doc[name + '_comments'] = '';
                doc[name + '_comments_timestamp'] = '';
            }

            var doc = {};

            doc.uid = uid || '';
            doc.name = name;
            doc.author = '';
            doc.location = '';
            doc.one_liner = '';
            doc.category = '';

            set_data('ux');
            set_data('foes');
            set_data('risk');
            set_data('costs');
            set_data('field');
            set_data('causes');
            set_data('events');
            set_data('changes');
            set_data('metrics');
            set_data('problem');
            set_data('adoption');
            set_data('approach');
            set_data('evidence');
            set_data('impacted');
            set_data('mechanism');
            set_data('partners');
            set_data('resources');
            set_data('activities');
            set_data('supporters');
            set_data('proposition');

            db.child('canvas').child(id).set(doc);

            state2(db, id, doc);
        }

        event.preventDefault();

        var id = slugy($(this).find('input').eq(0).val()),
            name = $(this).find('input').eq(0).val(),
            pwd1 = $(this).find('input').eq(1).val(),
            pwd2 = $(this).find('input').eq(2).val(),
            mail = id + '@example.com';

        if (pwd1 === pwd2) {
            db.child('canvas').child(id).once('value', function(snapshot) {
                var doc = {};

                if (!snapshot.val()) {
                    if (pwd1.length) {
                        db.createUser({email: mail, password: pwd1},
                            function(error, userData) {
                                if (!error) {
                                    create_canvas(db, id, userData.uid);
                                }
                            }
                        );

                    } else {
                        create_canvas(db, id);
                    }

                } else {
                    notify('error', 'This canvas already exists');
                }
            });

        } else {
            notify('error', 'Passwords don\'t match');
        }

        return false;
    });

    $('.e-canvas-content-md').click(function() {
        $(this).addClass('m-display-none');
        $(this).prev().removeClass('m-display-none').focus();
    });

    $('.e-canvas-content, .e-canvas-comment').focus(function() {
        $(this).data('prev-val', $(this).val());
    });

    $('.e-canvas-content, .e-canvas-comment, .e-canvas-descriptions').blur(
        function() {
            var $inp = $(this);

            if ($inp.data('prev-val') != $inp.val()) {
                var id = slugy($('#canvas-name').text()),
                    doc = {};

                doc[$inp.attr('name')] = $inp.val();

                if (!$inp.hasClass('e-canvas-descriptions')) {
                    doc[$inp.attr('name') + '_timestamp'] = new Date();
                }

                db.child('canvas').child(id).update(doc);

                notify('success', 'Canvas saved');
            }

            if ($inp.hasClass('e-canvas-content')) {
                $inp.addClass('m-display-none');
                $inp.next().html(markdown.toHTML($inp.val()));
                $inp.next().removeClass('m-display-none');

            } else if ($inp.hasClass('e-canvas-comment') && !$inp.val()) {
                $inp.addClass('m-display-none');
                $inp.siblings('.e-add-comment').removeClass('m-display-none');
            }
        }
    );

    $('#canvas-category').change(function() {
        var id = slugy($('#canvas-name').text()),
            doc = {};

        doc.category = $(this).val();

        db.child('canvas').child(id).update(doc);

        notify('success', 'Canvas saved');
    });

    $('.e-canvas-edit').click(function() {
        $('#edit-canvas').foundation('reveal', 'open');
    });

    $('#edit-canvas form').submit(function() {
        var cnvs_id = slugy($('#canvas-name').text()),
            mailbox = cnvs_id + '@example.com',
            old_pwd = $(this).find('[name="old_pwd"]').val(),
            new_pwd = $(this).find('[name="new_pwd"]').val(),
            confirm = $(this).find('[name="confirm"]').val(),
            updates = {};

        if (new_pwd === confirm) {
            if (new_pwd === old_pwd) {
                $('#edit-canvas').foundation('reveal', 'close');
                $('#edit-canvas form')[0].reset();

            } else if (new_pwd.length) {
                if (old_pwd.length) {
                    updates.email = mailbox;
                    updates.oldPassword = old_pwd;
                    updates.newPassword = new_pwd;

                    db.changePassword(updates, function(error) {
                        if (error === null) {
                            $('#edit-canvas').foundation('reveal', 'close');
                            $('#edit-canvas form')[0].reset();

                            notify('success', 'Canvas saved');

                        } else {
                            notify('error', 'Error changing password');
                        }
                    });

                } else {
                    updates.email = mailbox;
                    updates.password = new_pwd;

                    db.createUser(updates, function(error, userData) {
                        if (!error) {
                            var doc = {};

                            doc.uid = userData.uid;

                            db.child('canvas').child(cnvs_id).update(doc);

                            $('#edit-canvas').foundation('reveal', 'close');
                            $('#edit-canvas form')[0].reset();

                            notify('success', 'Canvas saved');
                        }
                    });
                }

            } else {
                updates.email = mailbox;
                updates.password = old_pwd;

                db.removeUser(updates, function(error) {
                    if (error === null) {
                        db.child('canvas').child(cnvs_id).update({uid: ''});

                        $('#edit-canvas').foundation('reveal', 'close');
                        $('#edit-canvas form')[0].reset();

                        notify('success', 'Canvas saved');

                    } else {
                        notify('error', 'Error changing password');
                    }
                });
            }

        } else {
            notify('error', 'Passwords don\'t match');
        }

        return false;
    });
});

function notify(type, text) {
    $('.b-system-message').text(text);
    $('.b-system-message').addClass('m-visible ' + type);

    setTimeout(function() {
        $('.b-system-message').removeClass('m-visible ' + type);

    }, 2000);
}

function slugy(value) {
    var reg1 = /[\u0300-\u036F]/g; // Use XRegExp('\\p{M}', 'g');
    var reg2 = /\s+/g;

    // The "$.data('attribute')" is commonly used as a source for the
    // "value" parameter, and it will convert digit only strings to
    // numbers. The "value.toString()" call will prevent failure in
    // this case, and whenever "value" is not a string.
    //
    value = value.toString().toLowerCase().trim();

    return unorm.nfkd(value).replace(reg1, '').replace(reg2, '_');
}

function reset_all() {
    $('#canvas').addClass('m-display-none');
    $('#landing').addClass('m-display-none');
    $('#canvas-name').text('');
    $('.e-canvas-descriptions').val('');
    $('.e-canvas-edit').addClass('m-display-none');
    $('.e-add-comment').removeClass('display-none');
    $('.e-canvas-content').val('');
    $('.e-canvas-comment').val('').addClass('m-display-none');
    $('.e-canvas-timestamp').addClass('m-display-none');
    $('#unlock-canvas input').val('');
    $('#unlock-canvas form').data('id', '');
    $('.e-canvas-timestamp .e-action').text('');
    $('.e-canvas-timestamp .e-timeago').text('').attr('title', '');
    $('#edit-canvas form')[0].reset();
    $('.b-create-canvas')[0].reset();

    history.replaceState(null, null, window.location.pathname);
}

function state0(db) {
    var canvas_id = window.location.search.slice(6).replace('/', '');

    $('.b-create-canvas select').empty();

    if (!canvas_id) {
        state1(db);

    } else {
        state2(db, canvas_id);
    }
}

function state1(db) {
    reset_all();
    db.unauth();

    db.child('canvas').once('value', function(snapshot) {
        $('.b-project-list p').remove();

        for (var oid in snapshot.val()) {
            var obj = snapshot.val()[oid],
                $p = $('<p/>').addClass('e-project-list-item'),
                $span = $('<span/>').attr('href', '#').text(obj.name);

            if (obj.uid) {
                $span.addClass('locked');
            }

            $('.b-project-list').append($p.append($span));
            $('.b-project-list').removeClass('m-display-none');
        }

        $('#landing').removeClass('m-display-none');
    });
}

function state2(db, id, object) {
    function setup_canvas(obj) {
        function set_data(item) {
            var t01 = obj[item + '_timestamp'] || '',
                t02 = obj[item + '_comments_timestamp'] || '',
                t03 = '',
                txt = '';

            if (t01 && !t02) {
                t03 = t01;
                txt = 'Edited ';

            } else if (!t01 && t02) {
                t03 = t02;
                txt = 'Commented ';

            } else if (t01 && t02) {
                t03 = new Date(t01) > new Date(t02) ? t01 : t02;
                txt = new Date(t01) > new Date(t02) ? 'Edited ' : 'Commented ';
            }

            $('#canvas-' + item).val(obj[item]);
            $('#canvas-' + item + '-comments').val(obj[item + '_comments']);
            $('#canvas-' + item + '-timestamp .e-action').text(txt);
            $('#canvas-' + item + '-timestamp .e-timeago').attr('title', t03);

            txt = obj[item + '_comments'];

            $('#canvas-' + item + '-md').html(markdown.toHTML(obj[item]));
        }

        set_data('ux');
        set_data('foes');
        set_data('risk');
        set_data('costs');
        set_data('field');
        set_data('causes');
        set_data('events');
        set_data('changes');
        set_data('metrics');
        set_data('problem');
        set_data('adoption');
        set_data('approach');
        set_data('evidence');
        set_data('impacted');
        set_data('mechanism');
        set_data('partners');
        set_data('resources');
        set_data('activities');
        set_data('supporters');
        set_data('proposition');

        $('#canvas-category option').each(function() {
            if (obj.category == $(this).val()) {
                $(this).prop('selected', true);
            }
        });

        $('#canvas-name').text(obj.name);
        $('#canvas-author').val(obj.author);
        $('#canvas-one-liner').val(obj.one_liner);
        $('#canvas-location').val(obj.location);
        $('#edit-canvas .e-canvas-name').val(obj.name);

        $('.e-canvas-comment.m-display-none').each(function() {
            if ($(this).val()) {
                $(this).removeClass('m-display-none');
                $(this).siblings('i').addClass('m-display-none');

            } else {
                $(this).siblings('i').removeClass('m-display-none');
            }
        });

        $('.e-canvas-timestamp.m-display-none').each(function() {
            if ($(this).children('.e-action').text().length) {
                $(this).removeClass('m-display-none');
            }
        });

        history.pushState(null, null, location.pathname + '?user=' + id);

        $('.e-canvas-edit').removeClass('m-display-none');
        $('.e-canvas-timestamp .e-timeago').timeago();
        $('#canvas').removeClass('m-display-none');
    }

    var usr = db.getAuth();

    reset_all();

    if (object) {
        if (!object.uid || (usr && object.uid == usr.uid)) {
            setup_canvas(object);

        } else {
            state1(db);
        }

    } else {
        db.child('canvas').child(id).once('value', function(snapshot) {
            var object = snapshot.val();

            if (snapshot.val()) {
                if (!object.uid || (usr && object.uid == usr.uid)) {
                    setup_canvas(object);

                } else {
                    state1(db);
                }

            } else {
                state1(db);
            }
        });
    }
}
