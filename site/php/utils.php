<?php
if(!function_exists('html_selectbox'))
{
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
}

if(!function_exists('array_unshift_assoc'))
{
	function array_unshift_assoc(&$arr,$key,$val) 
	{ 
		$arr = array_reverse($arr,true); 
		$arr[$key] = $val;
		$arr = array_reverse($arr,true); 
		return $arr; 
	}
}

if(!function_exists('getAnnotationAnomalies'))
{
	function getAnnotationAnomalies()
	{
		$anomalies = array();
		$anomalies[] = "scherer_haller_iftahumankidney";
		return($anomalies);
	}
}

if(!function_exists('isAnomaly'))
{
	function isAnomaly($dataset)
	{
		$anomalies = getAnnotationAnomalies();
		return(in_array($dataset,$anomalies));
	}
}

if(!function_exists('array_implode'))
{
	function array_implode($glue,$separator,$array)
	{
		if (!is_array($array)) { return($array); }
		$string = array();
		foreach ($array as $key => $val)
		{
			if (is_array($val))
			{
				$val = implode(",",$val);
			}
			$string[] = "{$key}{$glue}{$val}";
		}
		return implode($separator,$string);
	}
}

if(!function_exists('hex2rgb'))
{
	function hex2rgb($hex)
	{
	   $hex = str_replace("#", "", $hex);
	   if(strlen($hex) == 3)
	   {
		  $r = hexdec(substr($hex,0,1).substr($hex,0,1));
		  $g = hexdec(substr($hex,1,1).substr($hex,1,1));
		  $b = hexdec(substr($hex,2,1).substr($hex,2,1));
	   }
	   else
	   {
		  $r = hexdec(substr($hex,0,2));
		  $g = hexdec(substr($hex,2,2));
		  $b = hexdec(substr($hex,4,2));
	   }
	   $rgb = array($r,$g,$b);
	   //return implode(",", $rgb); // returns the rgb values separated by commas
	   return $rgb; // returns an array with the rgb values
	}
}

if(!function_exists('hex2rgb_norm'))
{
	function hex2rgb_norm($hex)
	{
	   $rgbn = hex2rgb($hex);
	   foreach ($rgbn as &$value)
	   {
		   $value = $value/255;
	   }
	   unset($value);
	   return($rgbn);
	}
}
?>
