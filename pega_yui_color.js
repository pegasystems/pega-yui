/* Copyright (c) 2006 Yahoo! Inc. All rights reserved. */
/* rgb2hsv function corrected, hergb2hsl function added, hsl2rgb function added */

pega.util.Color = function() {

    var hexchars = "0123456789ABCDEF";

    var real2int = function(n) {
        return Math.min(255, Math.round(n*256));
    };

    return {

        /**
         * HSV to RGB. h[0,360], s[0,1], v[0,1]
         */
        hsv2rgb: function(h,s,v) { 
            var r,g,b,i,f,p,q,t;
            i = Math.floor((h/60)%6);
            f = (h/60)-i;
            p = v*(1-s);
            q = v*(1-f*s);
            t = v*(1-(1-f)*s);
            switch(i) {
                case 0: r=v; g=t; b=p; break;
                case 1: r=q; g=v; b=p; break;
                case 2: r=p; g=v; b=t; break;
                case 3: r=p; g=q; b=v; break;
                case 4: r=t; g=p; b=v; break;
                case 5: r=v; g=p; b=q; break;
            }
            //alert([h,s,v] + "-" + [r,g,b]);

            return [real2int(r), real2int(g), real2int(b)];
        },

        hsl2rgb: function(h,s,l) { 
            var r,g,b,i,f,p,q,hk,tr,tg,tb;

            if (s == 0) {
                var newL = Math.ceil(l*255);
                return [newL, newL, newL];
            }
            else {
                if (l < 0.5)
                    q = l * (1 + s);
                else
                    q = l + s - (l * s);

                p = 2 * l - q;

                hk = h / 360;
                tr = hk + (1/3);
                tg = hk;
                tb = hk - (1/3);

                if (tr < 0) tr += 1;
                else if (tr > 1) tr -= 1;
                if (tg < 0) tg += 1;
                else if (tg > 1) tg -= 1;
                if (tb < 0) tb += 1;
                else if (tb > 1) tb -= 1;

                if (tr < 1/6)
                    r = p + ((q - p) * 6 * tr);
                else if (tr < 1/2)
                    r = q;
                else if (tr < 2/3)
                    r = p + ((q - p) * (2/3 - tr) * 6);
                else
                    r = p;

                if (tg < 1/6)
                    g = p + ((q - p) * 6 * tg);
                else if (tg < 1/2)
                    g = q;
                else if (tg < 2/3)
                    g = p + ((q - p) * (2/3 - tg) * 6);
                else
                    g = p;

                if (tb < 1/6)
                    b = p + ((q - p) * 6 * tb);
                else if (tb < 1/2)
                    b = q;
                else if (tb < 2/3)
                    b = p + ((q - p) * (2/3 - tb) * 6);
                else
                    b = p;

                return [Math.ceil(r*255), Math.ceil(g*255), Math.ceil(b*255)];
            }




            i = Math.floor((h/60)%6);
            f = (h/60)-i;
            p = v*(1-s);
            q = v*(1-f*s);
            t = v*(1-(1-f)*s);
            switch(i) {
                case 0: r=v; g=t; b=p; break;
                case 1: r=q; g=v; b=p; break;
                case 2: r=p; g=v; b=t; break;
                case 3: r=p; g=q; b=v; break;
                case 4: r=t; g=p; b=v; break;
                case 5: r=v; g=p; b=q; break;
            }
            //alert([h,s,v] + "-" + [r,g,b]);

            return [real2int(r), real2int(g), real2int(b)];
        },

        rgb2hsv: function(r,g,b) {
            var min,max,delta,h,s,v;
            min = Math.min(Math.min(r,g),b);
            max = Math.max(Math.max(r,g),b);
            delta = max-min;

            if (max == min)
                h = 0;
            else if (max == r) {
                h = 60*(g-b)/delta;

                if (g < b)
                    h += 360;
            }
            else if (max == g)
                h = 60*((b-r)/delta)+120;
            else if (max == b)
                h = 60*((r-g)/delta)+240;

            s = (max==0) ? 0 : 1-(min/max);

            return {"h": Math.ceil(h), "s": Math.ceil(s*100), "v": Math.ceil((max/255)*100)};

        },

        rgb2hsl: function(r,g,b) {
            r = r/255;
            g = g/255;
            b = b/255;
            var min,max,delta,h,s,l;
            min = Math.min(Math.min(r,g),b);
            max = Math.max(Math.max(r,g),b);
            delta = max-min;
            l = 0.5 * (max + min);

            if (max == min)
                h = 0;
            else if (max == r) {
                h = 60*(g-b)/delta;

                if (g < b)
                    h += 360;
            }
            else if (max == g)
                h = 60*((b-r)/delta)+120;
            else if (max == b)
                h = 60*((r-g)/delta)+240;

            if ((l == 0) || (max == min))
                s = 0;
            else if (l > 0.5)
                s = delta / (2 - 2*l);
            else
                s = delta / (2*l);

            return {"h": Math.ceil(h), "s": Math.ceil(s*100), "l": Math.ceil(l*100)};

        },

        rgb2hex: function (r,g,b) {
            return this.int2hex(r) + this.int2hex(g) + this.int2hex(b);
        },
     
        /**
         * Converts an int [0,255] to hex [00,FF]
         */
        int2hex: function(n) {
            n = n || 0;
            n = parseInt(n, 10);
            if (isNaN(n)) n = 0;
            n = Math.round(Math.min(Math.max(0, n), 255));

            return hexchars.charAt((n - n % 16) / 16) + hexchars.charAt(n % 16);
        },

        hex2dec: function(hexchar) {
            return hexchars.indexOf(hexchar.toUpperCase());
        },

        hex2rgb: function(s) { 
            var rgb = [];

            rgb[0] = (this.hex2dec(s.substr(0, 1)) * 16) + this.hex2dec(s.substr(1, 1));
            rgb[1] = (this.hex2dec(s.substr(2, 1)) * 16) + this.hex2dec(s.substr(3, 1));
            rgb[2] = (this.hex2dec(s.substr(4, 1)) * 16) + this.hex2dec(s.substr(5, 1));
            // gLogger.debug("hex2rgb: " + str + ", " + rgb.toString());
            return rgb;
        },

        isValidRGB: function(a) { 
            if ((!a[0] && a[0] !=0) || isNaN(a[0]) || a[0] < 0 || a[0] > 255) return false;
            if ((!a[1] && a[1] !=0) || isNaN(a[1]) || a[1] < 0 || a[1] > 255) return false;
            if ((!a[2] && a[2] !=0) || isNaN(a[2]) || a[2] < 0 || a[2] > 255) return false;

            return true;
        }
    }
}();

