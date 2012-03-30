<?php
function open_connection()
{
	include('config/config.php');
    $conn = mysql_connect($conn_data['host'],$conn_data['user'],$conn_data['pass']) or die(mysql_error());
    mysql_select_db($conn_data['name'],$conn);
    return $conn;
}

function close_connection($conn)
{
    mysql_close($conn);
}

function get_server_root()
{
	include('config/config.php');
	$root = $conn_data['root'];
	return($root);
}
?>
