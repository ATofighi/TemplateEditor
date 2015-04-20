<?php

defined('IN_MYBB') or die('Nope');

function TemplateEditor_success() {
	global $mybb, $sid;

	if($sid)
		log_admin_action($sid, $mybb->input['title']);

	if ( !empty($mybb->input['raw']) )
		die(json_encode(array('msg' => 'success')));
}

function TemplateEditor_info() {
	return array(
		'name'          => 'Template Editor',
		'author'        => 'Cake and Edited By ATofighi',
		'authorsite'	=> 'http://my-bb.ir',
		'version'       => '1.0',
		'compatibility' => '18*'
	);
}

function TemplateEditor_handler( &$actions ) {
	$actions['editor'] = array('active' => 'editor', 'file' => 'editor.php');
	return $actions;
}

function TemplateEditor_permissions( &$admin_permissions ) {
	global $lang;
	$lang->load('style_editor');
	$admin_permissions['editor'] = $lang->canUseTemplateEditor;
	return $admin_permissions;
}

function TemplateEditor_menu( &$sub_menu ) {
	global $lang;
	$lang->load('style_editor');
	$sub_menu['40'] = array('id' => 'editor', 'title' => $lang->templateEditor, 'link' => 'index.php?module=style-editor');
	return $sub_menu;
}

$plugins->add_hook('admin_style_templates_edit_template_commit', 'TemplateEditor_success');

$plugins->add_hook('admin_style_menu', 'TemplateEditor_menu');
$plugins->add_hook('admin_style_permissions', 'TemplateEditor_permissions');
$plugins->add_hook('admin_style_action_handler', 'TemplateEditor_handler');
