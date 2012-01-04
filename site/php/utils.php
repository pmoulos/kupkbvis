<?php
function html_selectbox($name, $values, $selected=NULL, $attributes=array())
{
	$attr_html = '';
	if(is_array($attributes) && !empty($attributes))
	{
		foreach ($attributes as $k=>$v)
		{
			$attr_html .= ' '.$k.'="'.$v.'"';
		}
	}

	$output = '<select name="'.$name.'" id="'.$name.'"'.$attr_html.'>'."\n";
	if(is_array($values) && !empty($values))
	{
		foreach($values as $key=>$value)
		{
			if(is_array($value))
			{
				$output .= '<optgroup label="'.$key.'">'."\n";
				foreach($value as $k=>$v)
				{
					$sel = $selected==$k ? ' selected="selected"' : '';
					$output .= '<option value="'.$k.'"'.$sel.'>'.$v.'</option>'."\n";
				}
				$output .= '</optgroup>'."\n";
			}
			else
			{
				$sel = $selected==$key ? ' selected="selected"' : '';
				$output .= '<option value="'.$key.'"'.$sel.'>'.$value.'</option>'."\n";
			}
		}
	}
	$output .= "</select>\n";
	
	return $output;
}

function array_unshift_assoc(&$arr, $key, $val) 
{ 
	$arr = array_reverse($arr,true); 
	$arr[$key] = $val;
	$arr = array_reverse($arr,true); 
	return $arr; 
} 
?>