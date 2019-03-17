<?php
	
	//firebase database link
	$firebaseDb_URL="https://dadhive-c1b2f.firebaseio.com/Match";
	$firebaseDb_URL_MainDb="https://dadhive-c1b2f.firebaseio.com";
	
	
	// mysql://b3fc5e3a090023:7739a5ab@us-cdbr-iron-east-03.cleardb.net/heroku_991814f83ba3829?reconnect=true
	// database configration
	$servername = "us-cdbr-iron-east-03.cleardb.net";
	$database = "heroku_991814f83ba3829";
	$username = "b3fc5e3a090023";
	$password = "7739a5ab";
    
	// Create connection

	$conn = mysqli_connect($servername, $username, $password, $database);

	// Check connection

	if (!$conn) {

	    die("Connection failed: " . mysqli_connect_error());

	}
    
	
?>