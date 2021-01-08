/**
*  VK plugin for Showtime
*
*  Copyright (C) 2015 Anatoly Shcherbinin (Cy-4AH)
*
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function(plugin) {
	var plugin_info = plugin.getDescriptor();
	var PLUGIN_NAME = plugin_info.id;
	var BASE_URL = "http://www.nyaa.si/";
	var logo = Plugin.path + "logo.png"
	var XML = require('showtime/xml');
	var service = require('showtime/service');
	var settings = require('showtime/settings');

	service.create(plugin.title, plugin.id + ":start", "video", true, logo);

	settings.globalSettings(plugin.id, plugin.title, logo, plugin.synopsis);
	settings.createString('BASE_URL', "Base URL without '/' at the end", 'http://www.nyaa.si', function(v) {
    	service.BASE_URL = v;
	});

	plugin.addURI(PLUGIN_NAME + ":home", function(page){
		page.redirect(PLUGIN_NAME + ":"+showtime.JSONEncode({page:"rss"}));
	});

	plugin.addURI(PLUGIN_NAME + ":(.*)", function(page,jsonQuery){

		var query = showtime.JSONDecode(jsonQuery);

		page.type = 'directory';
		page.metadata.title = query.term;

		var offset=1;

		(page.paginator = function()
		{
			page.loading = true;
			query.offset = offset;
			var doc = XML.parse(showtime.httpReq(BASE_URL, {args:query}).toString());
			++offset;

			var allItems = doc.rss.channel.filterNodes('item');
			if (0 == allItems.length)
			{
				page.loading = false;
				return false;
			}
			for (v in allItems)
			{
				var item = allItems[v];
				page.appendItem("torrent:browse:" + item.link, 'video', {title:item.title,
					description:item.description});
			}
			page.loading = false;
			page.entries = allItems.length;
			return true;
		})();
	});

	plugin.addSearcher("Search in "+plugin_info.title, plugin.path + plugin.icon, function(page, query){
		page.appendItem(PLUGIN_NAME + ":" + showtime.JSONEncode({page:"rss",term:query}), 'directory', {title:"Search for "+ query});
		page.entries = 1;
	});

})(this);
