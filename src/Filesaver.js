'use strict';

var mkdirp = require('mkdirp'),
	fs = require('fs'),
	tools = require('./tools'),
	path = require('path');



/*!
 * Rename file and launch callback
 * @param  {String}   oldPath  path to file to move
 * @param  {String}   newPath  path of destination
 * @param  {Function} callback signature: null, {filename, filepath}
 */
var move = function (oldPath, newPath, callback) {
	fs.rename( oldPath, newPath, function (err) {
		if (err) {
			callback( err );
		} else {
			callback( null, {
				filename: newPath.split( '/' ).pop(),
				filepath: newPath
			});
		}
	});
};

/*!
 * return safename file path
 * @param  {String} route target to analyze
 * @return {String}       route analyze
 */
var checkSafeName = function (route) {
	if ( this.safenames ) {
		route = route.split( '/' );
		var name = route.pop();
		var ext = name.split( '.' );
		var basename = ext.shift();
		basename = tools.safename( basename );
		name = [basename, ext].join( '.' );
		route.push( name );
		return route.join( '/' );
	} else {
		return route;
	}
};


/*!
 * check if params are right
 */
var checker = function (folder, oldPath, newPath, callback) {
	if (!callback && typeof newPath === 'function') {
		callback = newPath;
		newPath = oldPath.split( '/' ).pop();
	} else if (!newPath) {
		newPath = oldPath.split( '/' ).pop();
		callback = function () {};
	}
	// check for valid arguments
	if (folder && oldPath && (typeof folder === 'string') && (typeof oldPath === 'string') && fs.existsSync( oldPath )) {
		// check for existing folder
		if (this.folders[folder]) {
			// set target
			newPath = path.resolve( this.folders[folder], newPath );
			newPath = checkSafeName.call( this, newPath );
			return {newPath: newPath, callback: callback};
		} else {
			callback( 'invalid folder' );
			return false;
		}
	} else {
		callback( 'folder or origin not valid' );
		return false;
	}
};


/**
 * Filesaver constructor.
 *
 * Options:
 *
 * - folders: *Object*		with folder routes
 * - safename: *Boolean*	use safe name for files
 *
 * Example:
 *
 * ```js
 * var folders = {
 *     images: './images',
 *     books: './books'
 * }
 * var filesaver = new Filesaver({
 *     folders: folders,
 *     safenames: true
 * });
 * ```
 *
 * @param {Object} folders Folders schema
 */

var Filesaver = function (options) {
	var x;
	options = options || {};
	// Store folders
	this.folders = options.folders || {};
	this.safenames = options.safenames || false;

	// check for existing folders
	for (x in this.folders) {
		if (!fs.existsSync( this.folders[x] )){
			// create folder if not exists
			mkdirp( this.folders[x] );
		}
	}
};


/**
 * Add a new folder
 *
 * Example:
 *
 * ```js
 * filesaver.folder( 'documents', './path/to/folder', function () {
 *     // do something
 * });
 * ```
 * @param  {String}   name       name of new folder collection
 * @param  {Object}   path       path to its folder
 * @param  {Function} callback   no signature callback
 */

Filesaver.prototype.folder = function (name, folderPath, callback) {
	var _this = this;

	fs.exists( folderPath, function (exists) {
		if (!exists) {
			// create folder if not exists
			mkdirp( folderPath );
		}
		// add folder
		_this.folders[name] = folderPath;
		// optional callback
		if (callback){
			callback();
		}
	});
};


/**
 * Write or overwrite file
 *
 * Example:
 *
 * ```js
 * filesaver.put( 'images', '/path/temp/file.jpg', 'photo.jpg', function (err, data) {
 *     console.log( data );
 *     // ->
 *     // filename: 'photo.jpg',
 *     // filepath: './images/photo.jpg'
 *     });
 * ```
 *
 * @param  {String}   folder     name of parent folder folder
 * @param  {String}   oldPath     path to origin file
 * @param  {String}   newPath     name of newPath file
 * @param  {Function} callback   Signature: error, data. Data signature:{filename, filepath}
 */

Filesaver.prototype.put = function (folder, oldPath, newPath, callback) {
	var data = checker.call( this, folder, oldPath, newPath, callback );

	if (data) {
		newPath = data.newPath;
		callback = data.callback;
		move( oldPath, newPath, callback );
	}
};



/**
 * Write a file without overwriting anyone.
 *
 * Example:
 *
 * ```js
 * filesaver.add( 'images', '/path/temp/file.jpg', 'photo_1.jpg', function (err, data) {
 *     console.log( data );
 *     // ->
 *     // filename: 'photo_2.jpg',
 *     // filepath: './images/photo_2.jpg'
 *     });
 * ```
 *
 * @param  {String}   folder     name of parent folder folder
 * @param  {String}   oldPath     path to origin file
 * @param  {String}   newPath     Optional: name of newPath file
 * @param  {Function} callback   Optional: Signature: error, data. Data signature:{filename, filepath}
 */

Filesaver.prototype.add = function (folder, oldPath, newPath, callback) {

	var data = checker.call( this, folder, oldPath, newPath, callback );

	if (data) {
		callback = data.callback;
		newPath = tools.finalName( data.newPath );
		move( oldPath, newPath, callback );
	}
};


module.exports = Filesaver;
