
var Gallery = {
	Model: {},
	Collection: {},
	View: {},
	Router: {}
};

//
//  Models
//

Gallery.Model = (function() {
	var Album = Backbone.Model.extend({	
		defaults: {
			id: undefined,
			name: '',
			photos: [],
			selected: false
		}
	});
		
	var Photo = Backbone.Model.extend({
		defaults: {
			id: undefined,
			url: '',
			thumb_url: '',
			title: '',
			date: undefined,
			location: '',
			selected: false
		}
	});
	
	return {
		Album: Album,
		Photo: Photo
	};
})();

//
//	Collections
//

Gallery.Collection = (function() {
	var Albums = Backbone.Collection.extend({
		model: Gallery.Model.Album,
		url: 'sample_json.txt'
	});
	
	var Photos = Backbone.Collection.extend({
		model: Gallery.Model.Photo
	});
	
	return {
		Albums: Albums,
		Photos: Photos
	};
})();

//
//  Views
//

Gallery.View = (function() {	

	var AlbumStrip = Backbone.View.extend({
		id: 'album-strip',
		tagName: 'ul',
		initialize: function(options) {
			_(this).bindAll('hideStrip', 'showStrip', 'addAlbum');			
			this.albums = options.albums;
		},
		render: function() {	
			this.albums.each(this.addAlbum);		
			return this;
		},
		addAlbum: function(album) {
			var a = new AlbumThumbnail({
				album: album
			});

			$(this.el).append(a.render().el);
		},
		hideStrip: function() {
			$(this.el).animate({
				top: '-45px'				
			}, 300, function() {
				
			});
		},
		showStrip: function() {
			$(this.el).animate({
				top: '55px'				
			}, 300, function() {
				
			});
		}
	});
	
	var AlbumThumbnail = Backbone.View.extend({
		className: 'album-thumbnail',
		tagName: 'li',
		events: {
			'click': 'onClick' 
		},
		initialize: function(options) {			
			this.album = options.album;
		},
		render: function() {
			var template = _.template(Template.AlbumThumbnail, { thumb_url: this.album.get('photos')[0].thumb_url, album_name: this.album.get('name')});		
			$(this.el).html(template);
			return this;
		},
		onClick: function() {
			this.album.set('selected', true);
		}
	});
	
	var GalleryView = Backbone.View.extend({
		id: 'album',
		tagName: 'div',
		initialize: function(options) {
			var _this = this;

			// bind 'this' to the following functions
			_.bindAll(this, 'navigateToPhoto', 'navigateToAlbum', 'albumSelected');

			this.albums = options.albums;			
			this.albums.on('change:selected', this.albumSelected);
			this.router = options.router;
			
			// load the selected album, otherwise, the first album
			var albumid = options.album ? options.album : 1;
			var albumIndex = -1;
			this.albums.each(function(a){
				if (a.get('id') == albumid) {
					a.set('selected', true);
					albumIndex = _this.albums.indexOf(a);
				}
			});

			if (albumIndex === -1) {
				this.albums.first().set('selected', true);
				albumIndex = this.albums.indexOf(this.albums.first());
			}

			this.menubar = new MenuBar({ albums: this.albums });
			this.photoView = new Photo({ photos: this.photos });
			this.thumbnailStrip = new ThumbnailStrip({ photos: this.photos });

		},
		render: function() {
			$(this.el).append(this.menubar.render().el);			
			$(this.el).append(this.photoView.render().el);
			$(this.el).append(this.thumbnailStrip.render().el);
			
			return this;
		},
		albumSelected: function(album, selected) {
			if (selected) {
				var _this = this;
				// set all other albums to deselected
				this.albums.each(function (otherAlbum) {
					if (otherAlbum.id !== album.id) {
						otherAlbum.set('selected', false);
					}
				});

				// generate an array of photo models			
				var photos = _(album.get('photos')).map(function(p) {
					return new Gallery.Model.Photo(p);
				});		

				// create a new photo collection with list of photo models
				this.photos = new Gallery.Collection.Photos(photos);			
				this.photos.on('change:selected', function(photo, selected) {
					// set all other photos to deselected
					if (selected) {
						_this.photos.each(function (otherPhoto) {
							if (otherPhoto.id !== photo.id) {
								otherPhoto.set('selected', false);
							}
						});
					}
				});
				// select the first photo in the album
				this.photos.first().set('selected', true);
			}
		},
		navigateToAlbum: function(album) {
			this.router.navigate('album/' + album.get('id') + '/' + album.get('photos')[0].id, true);
		},
		navigateToPhoto: function(photo) {
			this.router.navigate('album/' + this.currentAlbum.get('id') + '/' + photo.get('id'), true);
		}
	});
	
	var MenuBar = Backbone.View.extend({
		id: 'menubar',
		events: {
			"click #display-albums-button": "albumsButtonClick",
			"click #display-albums-icon" : "albumsButtonClick"
		},
		initialize: function(options) {
			var _this = this;

			this.albums = options.albums;
			// get the first (and only) selected album
			this.selectedAlbum = this.albums.filter(function(album) { 
				return album.get('selected') == true;
			})[0];

			// on album selection change, update the title text
			this.albums.on('change:selected', function(album, selected) {
				if (selected) {
					_this.selectedAlbum = album;
					$(_this.el).children('#album-title').text(album.get('name'));		
				}
			});

			this.albumStrip = new AlbumStrip({
				albums: this.albums
			});

			this.albumStripVisible = false;
		},
		render: function() {
			var template = _.template(Template.MenuBar, { album_name: this.selectedAlbum.get('name') });
			$(this.el).html(template);
			$(this.el).append(this.albumStrip.render().el);
			return this;
		},
		albumsButtonClick: function() {
			this.albumStripVisible = !this.albumStripVisible;

			if (!this.albumStripVisible) {
				$(this.el).children('#display-albums-icon').removeClass('up-triangle');
				$(this.el).children('#display-albums-icon').addClass('down-triangle');
				$(this.el).children('#display-albums-icon').css('top', '23px');

				this.albumStrip.hideStrip();
			} else {
				$(this.el).children('#display-albums-icon').removeClass('down-triangle');
				$(this.el).children('#display-albums-icon').addClass('up-triangle');
				$(this.el).children('#display-albums-icon').css('top', '12px');

				this.albumStrip.showStrip();
			}
		}
	});
	
	var Photo = Backbone.View.extend({
		id: 'photo',
		events: {
			"click #previous-button": "prevPhoto",
			"click #next-button": "nextPhoto",
			"click #previous-button-icon": "prevPhoto",
			"click #next-button-icon": "nextPhoto"
		},
		initialize: function(options) {
			this.photos = options.photos;
			this.photo = this.photos.at(0);

			_.bindAll(this, 'selectedChanged');
			this.photos.on('change:selected', this.selectedChanged);
		},
		render: function() {
			$(this.el).html(this.getTemplate());
			return this;	
		},
		getTemplate: function() {
			return _.template(Template.PhotoView, { 
				url: this.photo.get('url'),
				title: this.photo.get('title'),
				date: this.photo.get('date'),
				location: this.photo.get('location') 
			});
		},
		nextPhoto: function() {
			var currIndex = this.photos.indexOf(this.photo);
			currIndex++;
			if (currIndex >= this.photos.size()) {
				currIndex = 0;
			}

			this.photo.set('selected', false);
			this.photo = this.photos.at(currIndex);
			this.photo.set('selected', true);
		},
		prevPhoto: function() {
			var currIndex = this.photos.indexOf(this.photo);
			if (currIndex === 0) {
				currIndex = this.photos.size();
			}

			this.photo.set('selected', false);
			this.photo = this.photos.at(currIndex - 1);
			this.photo.set('selected', true);
		},
		selectedChanged: function(photo, selected) {
			if (selected) {
				this.photo = photo;
				$(this.el).html(this.getTemplate());
			}
		}
	});
	
	var ThumbnailStrip = Backbone.View.extend({
		id: 'thumbnail-strip',
		tagName: 'ul',
		initialize: function(options) {
			this.photos = options.photos;
			this.thumbnails = new Array();
			_.bindAll(this, 'addThumbnail');
		},
		render: function() {			
			this.photos.each(this.addThumbnail);
			return this;
		},
		addThumbnail: function(photo) {
			var thumb = new Thumbnail({
				photo: photo
			});
			this.thumbnails.push(thumb);
			$(this.el).append(thumb.render().el);
		},
		loadPhotos: function(photos) {
			this.photos = photos;

			$(this.el).html('');
			this.thumbnails.length = 0;
			this.photos.each(this.addThumbnail);
		}		
	});	
	
	var Thumbnail = Backbone.View.extend({
		className: 'thumbnail',
		tagName: 'li',
		events: {
			'click' : 'select'
		},
		initialize: function(options) {
			this.photo = options.photo;
			this.photo.on('change:selected', function(photo, selected) {
				// toggle the thumbnail as unselected/selected
				var classToAdd = selected ? 'thumbnail-selected' : 'thumbnail-unselected';
				var classToRemove = selected ? 'thumbnail-unselected' : 'thumbnail-selected';

				$(this.el).children('img').removeClass(classToRemove);
				$(this.el).children('img').addClass(classToAdd);
			});
		},
		render: function() {	
			var template = _.template(Template.PhotoThumbnail, { thumb_url: this.photo.get('thumb_url')});		
			$(this.el).html(template);
			return this;
		},
		select: function(data) {
			this.photo.set('selected', !this.photo.get('selected'));
		}
	});
	
	return {
		GalleryView: GalleryView
	};
})();

//
//  Router
//

Gallery.Router = (function() {
	var Main = Backbone.Router.extend({
		routes: {
			'album/:album' : 'showAlbum',
			'album/:album/:photo' : 'showPhoto'
		},
		defaultRoute: function() {
			this.showAlbum();
		},
		initGallery: function(album, photo) {
			if (this.initialized) {
				return;	
			}
			
			this.initialized = true;
			$.ajax({
				url: 'sample.json',
				context: this,
				dataType: 'json',
				success: function(data) {
					var albums = new Gallery.Collection.Albums(data);
					this.albumView = new Gallery.View.GalleryView({
						albums: albums,
						router: this,
						selectedAlbum: album
					});
					$('body').append(this.albumView.render().el);
					if (photo) {
						this.albumView.selectPhoto(album, photo);
						//this.navigate('album/' + album + '/' + photo, true);
					}
				}
			});			
		},
		showAlbum: function(album, photo) {
			if (!this.initialized) {
				this.initGallery(album, photo);	
			} else {
				if (!photo) {
					photo = 1;
				}
				this.albumView.selectPhoto(album, photo);
			}		
		},
		showPhoto: function(album, photo) {
			if (!this.initialized) {
				this.initGallery(album, photo);
			} else {
				this.albumView.selectPhoto(album, photo);
			}
		}		
	});
	
	return {
		Main: Main
	};
})();

$(document).ready(function() {
	var router = new Gallery.Router.Main();
	Backbone.history.start();
	if (!router.initialized) {
		router.showAlbum(1);
	}
});