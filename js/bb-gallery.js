var Gallery = {};

Gallery.View = (function() {	
	var AlbumStrip = Backbone.View.extend({
		id: 'album-strip',
		tagName: 'ul',
		initialize: function(options) {
			_(this).bindAll('addAlbum', 'hideStrip', 'selectAlbum', 'showStrip');
			
			this.albums = options.albums;
			this.albums.each(this.addAlbum);
			this.selectAlbumCallback = options.selectAlbumCallback;
		},
		render: function() {
			
			return this;
		},
		addAlbum: function(album) {
			var a = new AlbumThumbnail({
				album: album,
				selectAlbumCallback: this.selectAlbum
			});
			
			$(this.el).append(a.render().el);
		},
		hideStrip: function() {
			$(this.el).animate({
				top: '-45px'				
			}, 300, function() {
				
			});
		},
		selectAlbum: function(album) {
			this.selectAlbumCallback(album);
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
			_(this).bindAll('onClick');
			
			this.album = options.album;
			this.selectAlbumCallback = options.selectAlbumCallback;
		},
		render: function() {
			var template = _.template(Template.AlbumThumbnail, { thumb_url: this.album.get('photos')[0].thumb_url, album_name: this.album.get('name')});		
			$(this.el).html(template);
			return this;
		},
		onClick: function() {
			this.selectAlbumCallback(this.album);
		}
	});
	
	var GalleryView = Backbone.View.extend({
		id: 'album',
		tagName: 'div',
		initialize: function(options) {
			this.albums = options.albums;
			this.router = options.router;
			
			this.albumStripVisible = false;
			
			// load the selected album, otherwise, the first album
			var albumid = options.album ? options.album : 1;
			this.initAlbum(albumid);

			// bind 'this' to the following functions
			_.bindAll(this, 'navigateToPhoto', 'navigateToAlbum', 'initAlbum', 'getCurrentAlbum', 'getPhotos', 'getCurrentPhoto', 'toggleAlbumStrip', 'selectPhoto', 'nextPhoto', 'prevPhoto');
		},
		initAlbum: function(albumid) {
			this.currentAlbum = this.albums.filter(function(a){
				return a.get('id') === albumid;
			})[0];
			
			if (!this.currentAlbum) {
				this.currentAlbum = this.albums.at(0);
			}
			
			// generate a list of photo models using underscore.js's map function 			
			var photos = _(this.currentAlbum.get('photos')).map(function(p) {
				return new Gallery.Model.Photo(p);
			});			
			
			// load the first photo on albumview creation
			this.currentPhoto = photos[0];
			
			// create a new photo collection with list of photo models
			this.photos = new Gallery.Collection.Photos(photos);
			
			if (this.thumbnailStrip) {
				this.thumbnailStrip.refresh();
			}
			
			if (this.menubar) {
				this.menubar.refresh();
			}
		},
		render: function() {
			// create and add a menubar view to gallery view
			this.menubar = new MenuBar({
				albumCallback: this.getCurrentAlbum,
				albums: this.albums,
				albumStripCallback: this.toggleAlbumStrip
			});
			$(this.el).append(this.menubar.render().el);
			
			// create and add an albumstrip to the gallery view
			this.albumStrip = new AlbumStrip({
				albums: this.albums,
				selectAlbumCallback: this.navigateToAlbum
			});
			$(this.el).append(this.albumStrip.render().el);
			
			// create and add a photo view to the gallery view
			this.photoView = new PhotoView({
				photo: this.currentPhoto,
				nextPhotoCallback: this.nextPhoto,
				prevPhotoCallback: this.prevPhoto
			});
			$(this.el).append(this.photoView.render().el);
			
			// create and add a new thumbnail strip view to the gallery view
			this.thumbnailStrip = new ThumbnailStrip({
				photosCallback: this.getPhotos,
				currentPhotoCallback: this.getCurrentPhoto,
				selectPhotoCallback: this.navigateToPhoto
			});
			$(this.el).append(this.thumbnailStrip.render().el);
			
			return this;
		},
		getCurrentAlbum: function() {
			return this.currentAlbum;
		},
		getCurrentPhoto: function() {
			return this.currentPhoto;
		},
		getPhotos: function() {
			return this.photos;
		},
		navigateToAlbum: function(album) {
			this.router.navigate('album/' + album.get('id') + '/' + album.get('photos')[0].id, true);
		},
		navigateToPhoto: function(photo) {
			this.router.navigate('album/' + this.currentAlbum.get('id') + '/' + photo.get('id'), true);
		},
		nextPhoto: function() {
			var currIndex = this.photos.indexOf(this.currentPhoto);
			currIndex++;
			if (currIndex >= this.photos.toArray().length) {
				currIndex = 0;
			}
			this.currentPhoto = this.photos.toArray()[currIndex];
			this.navigateToPhoto(this.currentPhoto);
		},
		prevPhoto: function() {
			var currIndex = this.photos.indexOf(this.currentPhoto);
			if (currIndex === 0) {
				currIndex = this.photos.toArray().length;
			}
			this.currentPhoto = this.photos.toArray()[currIndex - 1];
			this.navigateToPhoto(this.currentPhoto);
		},
		selectPhoto: function(albumid, photoid) {
			if (this.currentAlbum.get('id') !== albumid) {
				this.initAlbum(albumid);
			}
			
			this.currentPhoto = this.photos.find(function(p) { 
				return p.get('id') === photoid; 
			});
			this.currentIndex = photoid;
			this.photoView.showPhoto(this.currentPhoto);
			this.thumbnailStrip.selectPhoto(this.currentPhoto);
		},
		toggleAlbumStrip: function() {
			if (this.albumStripVisible) {
				this.albumStrip.hideStrip();
			} else {
				this.albumStrip.showStrip();
			}
			this.albumStripVisible = !this.albumStripVisible;
		}
	});
	
	var MenuBar = Backbone.View.extend({
		id: 'menubar',
		tagName: 'div',
		events: {
			"click #display-albums-button": "albumsButtonClick",
			"click #display-albums-icon" : "albumsButtonClick"
		},
		initialize: function(options) {
			_(this).bindAll('albumsButtonClick');
			
			this.albums = options.albums;
			this.getAlbum = options.albumCallback;
			this.toggleAlbumStrip = options.albumStripCallback;
			this.albumStripVisible = false;
		},
		render: function() {
			var template = _.template(Template.MenuBar, { album_name: this.getAlbum().get('name') });
			$(this.el).html(template);
			return this;
		},
		refresh: function() {
			$(this.el).children('#album-title').text(this.getAlbum().get('name'));		
		},
		albumsButtonClick: function() {
			if (this.albumStripVisible) {
				$(this.el).children('#display-albums-icon').removeClass('up-triangle');
				$(this.el).children('#display-albums-icon').addClass('down-triangle');
				$(this.el).children('#display-albums-icon').css('top', '23px');
			} else {
				$(this.el).children('#display-albums-icon').removeClass('down-triangle');
				$(this.el).children('#display-albums-icon').addClass('up-triangle');
				$(this.el).children('#display-albums-icon').css('top', '12px');
			}
			this.albumStripVisible = !this.albumStripVisible;
			this.toggleAlbumStrip();
		}
	});
	
	var PhotoView = Backbone.View.extend({
		id: 'photo',
		tagName: 'div',
		events: {
			"click #previous-button": "prevPhoto",
			"click #next-button": "nextPhoto",
			"click #previous-button-icon": "prevPhoto",
			"click #next-button-icon": "nextPhoto"
		},
		initialize: function(options) {
			this.photo = options.photo;
			this.nextPhoto = options.nextPhotoCallback;
			this.prevPhoto = options.prevPhotoCallback;
			_.bindAll(this, 'showPhoto');
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
		showPhoto: function(photo) {
			this.photo = photo;
			$(this.el).html(this.getTemplate());
		}
	});
	
	var ThumbnailStrip = Backbone.View.extend({
		id: 'thumbnail-strip',
		tagName: 'ul',
		initialize: function(options) {
			this.photos = options.photosCallback;
			this.currentPhoto = options.currentPhotoCallback;
			this.selectPhotoCallback = options.selectPhotoCallback;
			this.thumbnails = [];
			
			// bind these functions so 'this' refers to the thumbnailstrip view
			// when they're called
			_.bindAll(this, 'addThumbnail', 'photoSelected');
		},
		render: function() {
			this.initThumbnails();
			return this;
		},
		addThumbnail: function(p) {
			var thumb = new Thumbnail({
				photo: p,
				selectPhotoCallback: this.photoSelected
			});
			this.thumbnails.push(thumb);
			$(this.el).append(thumb.render().el);
		},
		initThumbnails: function() {
			// .each is built into backbone collections, 
			// thus no need to call it like _.each()
			this.photos().each(this.addThumbnail);
			this.selectPhoto(this.currentPhoto());
		},
		refresh: function() {
			$(this.el).html('');
			this.thumbnails.length = 0;
			this.initThumbnails();
		},
		photoSelected: function(photo) {
			this.selectPhotoCallback(photo);
		},
		selectPhoto: function(photo) {
			_.each(this.thumbnails, function(t) {
				if (t.photo === photo) {
					t.selected(true);
				} else {
					t.selected(false);
				}
			});
		}		
	});	
	
	var Thumbnail = Backbone.View.extend({
		className: 'thumbnail',
		tagName: 'li',
		events: {
			'click' : 'onClick'
		},
		initialize: function(options) {
			this.photo = options.photo;
			this.photo.selected = false;
			this.selectPhotoCallback = options.selectPhotoCallback;
		},
		render: function() {	
			var template = _.template(Template.PhotoThumbnail, { thumb_url: this.photo.get('thumb_url')});		
			$(this.el).html(template);
			return this;
		},
		onClick: function(data) {
			this.selectPhotoCallback(this.photo);
		},
		selected: function(isSelected) {
			// toggle the thumbnail as unselected/selected
			if (isSelected) {
				$(this.el).children('img').removeClass('thumbnail-unselected');
				$(this.el).children('img').addClass('thumbnail-selected');
			} else {
				$(this.el).children('img').removeClass('thumbnail-selected');
				$(this.el).children('img').addClass('thumbnail-unselected');
			}
		}
	});
	
	return {
		GalleryView: GalleryView
	};
})();

Gallery.Model = (function() {
	var Album = Backbone.Model.extend({	
	});
		
	var Photo = Backbone.Model.extend({
	});
	
	return {
		Album: Album,
		Photo: Photo
	};
})();

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
				url: 'gallery_json.txt',
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