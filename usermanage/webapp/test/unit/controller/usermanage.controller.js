/*global QUnit*/

sap.ui.define([
	"comknpltsiusermanagement/usermanage/controller/usermanage.controller"
], function (Controller) {
	"use strict";

	QUnit.module("usermanage Controller");

	QUnit.test("I should test the usermanage controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
