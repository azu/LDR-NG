// ==UserScript==
// @name           LDR NG
// @namespace      http://d.hatena.ne.jp/zaknak/20080909/1220936155
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.0.12
// @grant none
// ==/UserScript==

var w = window;

var ldrNg = {

    //NG条件に一致したときタイトルを置き換える文字列
    ngTitle: 'NG Item',

    NGINFO: [
        {
            channel: {
                force: true
            },
            item: {
                title: [/^AD:/, /^PR:/]
            }
        },
        {
            channel: {
                force: true
            },
            item: {
                link: /^https:\/\/alpha.app.net/
            }
        },
        {
            channel: {
                link: /^http:\/\/atnd.org/
            },
            item: {
                title: /TechBuzz/i,
                author: /TechBuzz/i
            }
        }
    ],

    initCount: 0,

    checkTarget: function (cond, target) {
        if (cond.force) {
            return true;
        }
        var method = cond.and ? 'every' : 'some';
        for (var i in cond) {
            if (i == 'and' || i == 'force') {
                continue;
            }
            if (cond[i].length) {
                if (cond[i][method](function (obj) {
                    return obj.test(target[i]);
                })) {
                    return true;
                }
            } else {
                if (cond[i].test(target[i])) {
                    return true;
                }
            }
        }
    },

    before: function (feed) {
        if (feed._checkedNg) {
            return;
        }
        var items = feed.items;

        ldrNg.NGINFO.forEach(function (ng) {
            if (!ldrNg.checkTarget(ng.channel, feed.channel)) {
                return;
            }

            items.forEach(function (item) {
                if (ldrNg.checkTarget(ng.item, item)) {
                    feed._ngIDlist = feed._ngIDlist || [];
                    feed._ngIDlist.push(item.id);
                    item._ngItem = true;
                    item._title = item.title;
                    item.title = ldrNg.ngTitle;
                }
            });
        });

        feed._checkedNg = true;
        if (feed._ngIDlist) {
            feed.items = items.filter(function (item) {
                return !item._ngItem
            }).concat(items.filter(function (item) {
                return item._ngItem
            }));
        }

    },
    after: function (feed) {
        if (!feed._ngIDlist) {
            return;
        }

        feed._ngIDlist.forEach(function (id) {
            (function (id) {
                var self = arguments.callee;
                self.count = self.count || 0;
                var bodyId = 'item_body_' + id;
                var itemId = 'item_' + id;
                var itemBody = w.$(bodyId);
                if (itemBody) {
                    w.addClass(itemBody, 'ngbody');
                    w.addClass(itemId, 'ngitem');
                } else if (self.count++ < 10) {
                    setTimeout(self, 500, id);
                }
            })(id);
        });
    },

    openNG: function () {
        var count = w.get_active_item();
        if (typeof count != 'number') {
            w.message('nothing...');
            return;
        }

        var item = w.get_active_feed().items[count];
        if (!item._ngItem) {
            w.message('This item is not NG.');
            return;
        }

        var bodyId = 'item_body_' + item.id;
        var itemId = 'item_' + item.id;
        var headId = 'head_' + item.id;
        w.removeClass(bodyId, 'ngbody');
        w.removeClass(itemId, 'ngitem');

        var head = w.$(headId);
        var link = head.getElementsByTagName('a')[0];
        link.textContent = item._title;
        w.message('Done...');

    },

    init: function () {
        if (typeof w.Keybind != 'undefined' && typeof w.register_hook != 'undefined') {
            w.Keybind.add('N', ldrNg.openNG);
            w.LDR_addStyle('div.ngbody', 'display : none;');
            w.LDR_addStyle('div.ngitem', 'font-size : 6px;');
            w.register_hook("before_printfeed", ldrNg.before);
            w.register_hook("after_printfeed", ldrNg.after);
            w.message("LDR NG SETUP is completed.");
        } else if (ldrNg.initCount < 5) {
            setTimeout(ldrNg.init, 500);
            ldrNg.initCount++;
        }
    }
};

ldrNg.init();
