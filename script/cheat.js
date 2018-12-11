var lookup = {
		'0': 'digit0',
		'1': 'digit1',
		'2': 'digit2',
		'3': 'digit3',
		'4': 'digit4',
		'5': 'digit5',
		'6': 'digit6',
		'7': 'digit7',
		'8': 'digit8',
		'9': 'digit9',
		'E': 'ltrE',
		'e': 'ltrE',
		'r': 'ltrR',
		'o': 'ltrO',
		'.': 'dp',
		'-': 'neg',
		'+': ''
	};

	var currentDisplay = [];
	var currentLength = 1;
	var displayStr = '0.';
	var value_prior = 0;
	var value_current = 0;
	var memory = 0;
	var current_op = '';
	var flag_err = false;
	var flag_decimal = false;
	var flag_found_decimal = false;
	var flag_new_op = false;

	function leadingZeroes(str) {
	    var result;
		if(result = /^-*(0+)\.(0*)/.exec(str)) {
	        return result[1].length + result[2].length;
		} else {
			return 0;
		}
	}

	function str2Display(str) {
		var flag_exp = false;
		var val = parseFloat(str);
     
		// Append a decimal if it's not in the middle
		if(!/\./.test(str)) {
			str += '.';
		}

		// Check positive Overflow
		if(val > 9999999999) {
			str = val.toExponential(6);
			flag_exp = true;
		}
		// Check negative Overflow
		if(val < -999999999) {
			str = val.toExponential(5);
			flag_exp = true;
		}

		if(!flag_exp) {
			// Check too many digits, positive
			if(val > 0 && str.length > 11) {

				str = val.toPrecision(10 - leadingZeroes(str)).toString();
			}
			// Check too many digits, negative
			if(val < 0 && str.length > 10 && !/\.$/.test(str)) {
				str = val.toPrecision(9 - leadingZeroes(str)).toString();
			}
		}

		var segment = 0;
		var output = str.split('').reverse();
		// Remove current characters
		currentDisplay.forEach(function(char) {
			var outClass = lookup[char];
			$('#seg' + segment).removeClass(outClass);
			if(char != '.' && char != '+') {
				segment++;
			}
		});
		currentDisplay = [];
		segment = 0;

		// Display characters
		output.forEach(function(char) {
			var outClass = lookup[char];
			$('#seg' + segment).addClass(outClass);
			currentDisplay.push(char);
			if(char != '.' && char != '+') {
				segment++;
			}
		});
		currentLength = segment;
	}

	// Math!
	function operation(op) {
		console.log("op:", op, "value_current:", value_current, "value_prior:", value_prior);
		if(op === 'equal') {
			switch(current_op) {
				case "plus":
					value_current +=  value_prior;
					displayStr = value_current.toString();
					break;
				case "sub":
					value_current = value_prior - value_current;
					displayStr = value_current.toString();
					break;
				case "mul":
					value_current *= value_prior;
					displayStr = value_current.toString();
					break;
				case "div":
					if(value_current === 0) {
						displayStr = "Error";
						flag_err = true;
					} else {
						value_current = value_prior / value_current;
						displayStr = value_current.toString();
					}
					break;
				case "equal":
					// Take no action
					break;
			}
			flag_new_op = true;
			current_op = "equal";
			str2Display(displayStr);
			value_prior = parseFloat(displayStr);
			console.log("update prior", value_prior);
		} else {
			// Handle single operator event,
			switch(op) {
				case "sqrt":
					if(value_current < 0) {
						displayStr = "Error";
						value_current = 0;
					} else {
						value_current = Math.sqrt(value_current);
						displayStr = value_current.toString();
					}
					break;
				case "percent":
					value_current /= 100;
					displayStr = value_current.toString();
					break;
				case "sign":
					value_current *= -1;
					displayStr = value_current.toString();
					break;
				default:
					// For any infix operator
					current_op = op;
					flag_new_op = true;
					value_prior = value_current;
					console.log("update prior", value_prior);
			}
			str2Display(displayStr);
		}
		console.log("op:", op, "value_current:", value_current, "value_prior:", value_prior);
	}


	$(document).ready(function() {
		// Initialize the display:
		str2Display(displayStr);

		// Button Press Sound
		$('.button').mousedown(function() {
			$('#myaudio')[0].play();
		});

		// Handle Numbers
		$('.number').click(function() {
			var val = $(this).val();

			if(!flag_err && (currentLength < 10 || flag_new_op)) {
				// New operator means any numeric key starts new input
				if(flag_new_op) {
					displayStr = '0.';
					flag_new_op = false;
				}

				// Decimal point just sets decimal flag
				if(val === '.') {
					flag_decimal = true;
					flag_found_decimal = true;
					str2Display(displayStr);
					value_current = parseFloat(displayStr);
					return;
				}

				// Convert new input into string
				val = val.toString();

				if(parseFloat(displayStr) === 0 && displayStr.length < 3 && !flag_found_decimal) {
					// Non-Decimal first input
					displayStr = val;
				} else {
					if(flag_decimal && flag_found_decimal) {
						// First Number after a decimal point
						displayStr = parseFloat(displayStr).toString()+ '.' + val;
						flag_found_decimal = false;
					} else {
						// Additional numbers after decimal point
						if(parseFloat(displayStr) === 0 && displayStr.length > 2) {
							displayStr += val;
						} else {
							displayStr = parseFloat(displayStr).toString() + val;
						}

					}
				}

				// Display New Value
				str2Display(displayStr);

				// Update the current value register
				value_current = parseFloat(displayStr);
			}
		});


		// Handle Operators
		$('.operator').click(function() {
			var op = $(this).val();
			operation(op);
		});

		// Handle Memory buttons
		$('.memory').click(function(){
			var op = $(this).val();
			switch(op){
				case "mrc":
					value_current = memory;
					displayStr = value_current.toString()
					str2Display(displayStr);
					console.log("Mrc: ", memory);
					$('.mr').removeClass('active');
					memory = 0;
					flag_new_op = true;
					break;
				case "mplus":
					operation('equal');
					memory += value_current;
					console.log("M+: ", memory);
					$('.mr').addClass('active');
					break;
			}

		});

		// Handle Clear Error
		$('.cce').click(function() {
		 	currentLength = 1;
		 	flag_err = false;
		 	flag_decimal = false;
		 	value_current = 0;
			displayStr = '0.';
			str2Display(displayStr);
		});

	});