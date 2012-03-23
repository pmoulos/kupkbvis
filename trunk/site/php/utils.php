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

function array_unshift_assoc(&$arr,$key,$val) 
{ 
	$arr = array_reverse($arr,true); 
	$arr[$key] = $val;
	$arr = array_reverse($arr,true); 
	return $arr; 
}

function array_intersect_fixed($array1,$array2)
{ 
	$result = array();
	foreach ($array1 as $val)
	{ 
		if (($key = array_search($val,$array2,TRUE))!==false)
		{ 
			$result[] = $val; 
			unset($array2[$key]); 
		} 
	} 
	return $result; 
}
function my_array_intersect($a,$b) 
{ 
        for($i=0;$i<sizeof($a);$i++) 
        { 
                $m[]=$a[$i]; 
        } 
        for($i=0;$i<sizeof($a);$i++) 
        { 
                $m[]=$b[$i]; 
        } 
        sort($m); 
        $get=array(); 
        for($i=0;$i<sizeof($m);$i++) 
        { 
                if($m[$i]==$m[$i+1]) 
                $get[]=$m[$i]; 
        } 
        return $get; 
} 
?>
