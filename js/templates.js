var Template = (function() {
	var AlbumThumbnail = "\
					<div> \
						<img src='<%= thumb_url %>' /> \
					</div> \
					<span><%= album_name %></span> \
					";
	var MenuBar = "\
					<h1 id='album-title'><%= album_name %></h1> \
					<button id='display-albums-button'></button> \
					<div class='down-triangle' id='display-albums-icon'></div> \
					";
	var PhotoView = "\
					<div id='photo-frame'> \
						<img src='<%= url %>' id='selected-photo'></img> \
					</div> \
					<div id='photo-details'> \
							<button id='previous-button' class='photo-button'></button> \
							<div class='left-triangle' id='previous-button-icon'></div> \
							<div id='photo-title'><%= title %></div> \
							<div id='photo-description'><%= location %> - <%= date %></div> \
							<button id='next-button' class='photo-button'></button> \
							<div class='right-triangle' id='next-button-icon'></div> \
					</div> \
					";
	var PhotoThumbnail = "<img class='thumbnail-unselected' src='<%= thumb_url %>' />";

	return {
		AlbumThumbnail: AlbumThumbnail,
		PhotoThumbnail: PhotoThumbnail,
		MenuBar: MenuBar,
		PhotoView: PhotoView 
	};
})();


