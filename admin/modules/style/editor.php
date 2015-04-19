<?php
/**
* MyBB 1.8 Plugin
* Copyright 2015 MyBB Group, All Rights Reserved
*
* Website: http://www.mybb.com
* License: http://www.mybb.com/about/license
*
*/

// Disallow direct access to this file for security reasons
if(!defined("IN_MYBB"))
{
	die("Direct initialization of this file is not allowed.<br /><br />Please make sure IN_MYBB is defined.");
}

$lang->load('style_templates');
$lang->load('style_editor');

$sid = $mybb->get_input('sid', MyBB::INPUT_INT);

if ( $mybb->input['action'] == 'get_template' && $mybb->input['sid'] && $mybb->input['title'] ) {
	$query    = $db->simple_select("templates", "*", "title='" . $db->escape_string((string) $mybb->input['title']) . "' AND (sid='-2' OR sid='{$sid}')", array('order_by' => 'sid', 'order_dir' => 'DESC', 'limit' => 1));
	$template = $db->fetch_array($query);

	die(isset($template['title']) ? json_encode(array('sid' => $sid, 'tid' => (int) $template['tid'], 'title' => $template['title'], 'template' => $template['template'])) : 'error');
}


if ( $mybb->input['action'] == 'edit' && $mybb->input['sid'] ) {

	$page->extra_header .= '
	<script>
		lang.youhaveunsavedthing = "'.$lang->unsavedChanges.'";
		lang.saveAndContinueEditing = "'.$lang->saveAndContinueEditing.'";
		lang.couldNotSave = "'.$lang->couldNotSave.'";
	</script>
	<link type="text/css" href="./styles/default/template/fontawesome/css/font-awesome.min.css" rel="stylesheet" />
	<link type="text/css" href="./styles/default/template.css" rel="stylesheet" id="cp-lang-style" />
	<script src="./jscripts/template/ace/ace.js"></script>
	<script src="./jscripts/template/ace/ext-language_tools.js"></script>
	<script>var sid = ' . $sid . ', my_post_key = "' . $mybb->post_code . '";</script>
	<script src="jscripts/template.js"></script>';

	$template_sets = array(-1 => $lang->global_templates);

	$data  = '';
	$query = $db->simple_select("templatesets", "sid,title", '', array('order_by' => 'title', 'order_dir' => 'ASC'));

	while ( $template_set = $db->fetch_array($query) )
		$template_sets[$template_set['sid']] = $template_set['title'];

	$page->output_header("Editing {$template_sets[$sid]}");

	$query = $db->simple_select("templatesets", "sid, title");

	while ( $set = $db->fetch_array($query) ) {
		$template_sets[$set['sid']] = $set['title'];
	}

	$template_groups = array('ungrouped' => array('title' => $lang->ungrouped_templates));

	$query = $db->simple_select("templategroups", "*");

	while ( $templategroup = $db->fetch_array($query) )
		$template_groups[$templategroup['prefix']] = array('title' => $lang->sprintf($lang->templates, htmlspecialchars_uni($lang->parse($templategroup['title']))),
														   'gid'   => $templategroup['gid']);

	$templates_group = array();

	$query = $db->query('SELECT tid, title FROM ' . TABLE_PREFIX . 'templates WHERE ' . ($sid == -1 ? 'sid=-1' : 'sid = "' . $sid . '" OR sid = -2') . ' GROUP BY title ORDER BY version DESC');

	while ( $template = $db->fetch_array($query) ) {
		$exploded = explode("_", $template['title'], 2);

		if ( isset($template_groups[$exploded[0]]) )
			$template['group'] = $exploded[0];
		else
			$template['group'] = 'ungrouped';

		$templates_group[$template['group']][$template['title']] = $template['tid'];
	}

	ksort($templates_group);

	foreach ( $templates_group as $group => $templates ) {
		$data .= '<li class="template_li"><span>' . $template_groups[$group]['title'] . '</span>';
		if ( !empty($templates) ) {
			$data .= '<ul class="template_parent">';

			ksort($templates);

			foreach ( $templates as $template => $tid )
				$data .= '<li class="template_item template" template="' . $template . '">' . $template . '</li>';

			$data .= '</ul>';
		}

		$data .= '</li>';
	}

	# Lazy as I hate the template system
	echo '
	<div class="saved">'.$lang->savedTheTemplate.'</div>
	<div id="template_editor" class="template_editor">
	<div class="goBack">
		
	</div>
	<div class="left_pane">
		<div class="searchBox">
			<input class="search" type="text" spellcheck="false" autocomplete="off" placeholder="'.$lang->search.'">
			<input class="save" type="submit" value="'.$lang->save.'">
			<input class="closeBack" type="button" value="'.$lang->close.'" onclick="window.location=\'./index.php?module=style-editor\'">
		</div>
		<ul class="template_list">
			' . $data . '
		</ul>
	</div>

	<div class="right_pane">
		<div class="main_1">
			<div id="scrollerBtn" style="display: none">
				<span class="goBack" data-add="30"><i class="fa fa-angle-left"></i></span>
				<span class="goNext" data-add="-30"><i class="fa fa-angle-right"></i></span>
			</div>
			<ul id="main_tabs" class="main_tabs"></ul>
		</div>
		<div id="aceEditor" class="main_editor"></div>
	</div>';

} else {
	$page->output_header($lang->template_sets);

	$themes = array();

	$query = $db->simple_select("themes", "name,tid,properties", "tid != '1'");

	while ( $theme = $db->fetch_array($query) ) {
		$tbits = unserialize($theme['properties']);
		$themes[$tbits['templateset']][$theme['tid']] = htmlspecialchars_uni($theme['name']);
	}

	$template_sets              = array();
	$template_sets[-1]['title'] = $lang->template_sets;
	$template_sets[-1]['sid']   = -1;

	$query = $db->simple_select("templatesets", "*", "", array('order_by' => 'title', 'order_dir' => 'ASC'));

	while ( $template_set = $db->fetch_array($query) )
		$template_sets[$template_set['sid']] = $template_set;

	$table = new Table;
	$table->construct_header($lang->template_set);
	$table->construct_header($lang->controls, array("class" => "align_center", "width" => 150));

	foreach ( $template_sets as $set ) {
		if ( $set['sid'] == -1 ) {
			$table->construct_cell("<strong><a href=\"index.php?module=style-editor&amp;sid=-1&amp;action=edit\">{$lang->global_templates}</a></strong><br /><small>{$lang->usedByAllThemes}</small>");
			$table->construct_cell("<a href=\"index.php?module=style-editor&amp;sid=-1&amp;action=edit\">{$lang->edit}</a>", array("class" => "align_center"));
			$table->construct_row();
			continue;
		}

		if ( $themes[$set['sid']] )
			$used_by_note = "{$lang->usedBy}: " . implode(', ', $themes[$set['sid']]);
		else
			$used_by_note = $lang->notUsedByAny;

		$actions = "<a href=\"index.php?module=style-editor&amp;sid={$set['sid']}&amp;action=edit\">{$lang->edit}</a>";

		$table->construct_cell("<strong><a href=\"index.php?module=style-editor&amp;sid={$set['sid']}&amp;action=edit\">{$set['title']}</a></strong><br /><small>{$used_by_note}</small>");
		$table->construct_cell($actions, array("class" => "align_center"));
		$table->construct_row();
	}

	$table->output($lang->template_sets);

}

$page->output_footer();
