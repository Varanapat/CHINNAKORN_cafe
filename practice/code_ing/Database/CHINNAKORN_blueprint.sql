BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Category" (
	"category_id"	INTEGER,
	"category_name"	VARCHAR(50),
	PRIMARY KEY("category_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Employee" (
	"employee_id"	INTEGER,
	"password"	VARCHAR(50),
	"first_name"	VARCHAR(50),
	"last_name"	VARCHAR(50),
	"phone_em"	VARCHAR(10),
	"address"	VARCHAR(100),
	"hire_date"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"role"	VARCHAR(50),
	"salary"	INT,
	PRIMARY KEY("employee_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Ingredient" (
	"ingredient_id"	INTEGER,
	"ingredient_name"	VARCHAR(100) NOT NULL,
	"stock_qty"	DECIMAL(10, 2) DEFAULT 0,
	"unit"	VARCHAR(20) DEFAULT 'g',
	"is_active"	INTEGER DEFAULT 1,
	PRIMARY KEY("ingredient_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "ItemOption" (
	"option_id"	INTEGER,
	"option_group_id"	INTEGER NOT NULL,
	"option_name"	VARCHAR(100) NOT NULL,
	"extra_price"	DECIMAL(10, 2) DEFAULT 0.00,
	"is_active"	INTEGER DEFAULT 1,
	PRIMARY KEY("option_id" AUTOINCREMENT),
	FOREIGN KEY("option_group_id") REFERENCES "OptionGroup"("option_group_id")
);
CREATE TABLE IF NOT EXISTS "ItemOptionIngredient" (
	"option_id"	INTEGER NOT NULL,
	"ingredient_id"	INTEGER NOT NULL,
	"quantity"	DECIMAL(10, 2) NOT NULL,
	"unit"	VARCHAR(20) DEFAULT 'ml',
	PRIMARY KEY("option_id","ingredient_id"),
	FOREIGN KEY("ingredient_id") REFERENCES "Ingredient"("ingredient_id"),
	FOREIGN KEY("option_id") REFERENCES "ItemOption"("option_id")
);
CREATE TABLE IF NOT EXISTS "Menu" (
	"menu_id"	INTEGER,
	"category_id"	INTEGER,
	"menu_name"	VARCHAR(50),
	"menu_image"	VARCHAR(50),
	"is_available"	INTEGER DEFAULT 1,
	"base_price"	INTEGER,
	"description"	TEXT,
	PRIMARY KEY("menu_id" AUTOINCREMENT),
	FOREIGN KEY("category_id") REFERENCES "Category"("category_id")
);
CREATE TABLE IF NOT EXISTS "MenuIngredient" (
	"menu_id"	INTEGER NOT NULL,
	"ingredient_id"	INTEGER NOT NULL,
	"quantity"	DECIMAL(10, 2) NOT NULL,
	"unit"	VARCHAR(20) DEFAULT 'g',
	PRIMARY KEY("menu_id","ingredient_id"),
	FOREIGN KEY("ingredient_id") REFERENCES "Ingredient"("ingredient_id"),
	FOREIGN KEY("menu_id") REFERENCES "Menu"("menu_id")
);
CREATE TABLE IF NOT EXISTS "OptionGroup" (
	"option_group_id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"group_name" VARCHAR(100) NOT NULL,
	"is_required" INTEGER DEFAULT 0,
	"max_select" INTEGER DEFAULT 1,
	"display_order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Menu_OptionGroup" (
	"menu_optiongroup_id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"menu_id" INTEGER NOT NULL,
	"option_group_id" INTEGER,
	"is_required" INTEGER DEFAULT 0,
	"display_order" INTEGER DEFAULT 0,
	FOREIGN KEY("menu_id") REFERENCES "Menu"("menu_id"),
	FOREIGN KEY("option_group_id") REFERENCES "OptionGroup"("option_group_id")
);

CREATE TABLE IF NOT EXISTS "Order" (
	"order_id"	TEXT,
	"order_time"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"total_price"	INTEGER,
	"order_type"	TEXT NOT NULL DEFAULT 'TAKEAWAY' CHECK("order_type" IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY')),
	PRIMARY KEY("order_id")
);
CREATE TABLE IF NOT EXISTS "OrderItem" (
	"order_item_id"	INTEGER,
	"order_id"	TEXT,
	"menu_id"	INTEGER,
	"quantity"	INTEGER,
	"price"	INTEGER,
	PRIMARY KEY("order_item_id" AUTOINCREMENT),
	FOREIGN KEY("menu_id") REFERENCES "Menu"("menu_id"),
	FOREIGN KEY("order_id") REFERENCES "Order"("order_id")
);
CREATE TABLE IF NOT EXISTS "OrderItemOption" (
	"order_item_option_id"	INTEGER,
	"order_item_id"	INTEGER,
	"option_id"	INTEGER,
	"extra_price"	INTEGER,
	PRIMARY KEY("order_item_option_id" AUTOINCREMENT),
	FOREIGN KEY("option_id") REFERENCES "ItemOption"("option_id"),
	FOREIGN KEY("order_item_id") REFERENCES "OrderItem"("order_item_id")
);
CREATE TABLE IF NOT EXISTS "OrderPromotion" (
	"order_id"	INTEGER,
	"promotion_id"	INTEGER,
	PRIMARY KEY("order_id","promotion_id"),
	FOREIGN KEY("order_id") REFERENCES "Order"("order_id"),
	FOREIGN KEY("promotion_id") REFERENCES "Promotion"("promotion_id")
);
CREATE TABLE IF NOT EXISTS "Payment" (
	"payment_id"	INTEGER,
	"order_id"	INTEGER NOT NULL,
	"payment_method"	TEXT NOT NULL,
	"amount"	INTEGER NOT NULL,
	"payment_time"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("payment_id" AUTOINCREMENT),
	FOREIGN KEY("order_id") REFERENCES "Order"("order_id")
);
CREATE TABLE IF NOT EXISTS "Promotion" (
	"promotion_id"	INTEGER,
	"promotion_name"	TEXT,
	"discount_type"	TEXT,
	"discount_value"	INTEGER,
	"start_date"	DATE,
	"end_date"	DATE,
	"active"	INTEGER,
	PRIMARY KEY("promotion_id" AUTOINCREMENT)
);
INSERT INTO "Category" VALUES (1,'กาแฟ');
INSERT INTO "Category" VALUES (2,'ชา');
INSERT INTO "Category" VALUES (3,'นม');
INSERT INTO "Category" VALUES (4,'เครื่องดื่มเพื่อสุขภาพ');
INSERT INTO "Category" VALUES (5,'เบเกอรี่และของหวาน');
INSERT INTO "ItemOption" VALUES (1,1,'เล็ก',0,1);
INSERT INTO "ItemOption" VALUES (2,1,'กลาง',10,1);
INSERT INTO "ItemOption" VALUES (3,1,'ใหญ่',20,1);
INSERT INTO "ItemOption" VALUES (4,2,'ร้อน',0,1);
INSERT INTO "ItemOption" VALUES (5,2,'เย็น',0,1);
INSERT INTO "ItemOption" VALUES (6,2,'ปั่น',10,1);
INSERT INTO "ItemOption" VALUES (7,3,'0%',0,1);
INSERT INTO "ItemOption" VALUES (8,3,'25%',0,1);
INSERT INTO "ItemOption" VALUES (9,3,'50%',0,1);
INSERT INTO "ItemOption" VALUES (10,3,'75%',0,1);
INSERT INTO "ItemOption" VALUES (11,3,'100%',0,1);
INSERT INTO "ItemOption" VALUES (12,3,'125%',0,1);
INSERT INTO "ItemOption" VALUES (13,3,'150%',0,1);
INSERT INTO "ItemOption" VALUES (14,4,'นมสด',0,1);
INSERT INTO "ItemOption" VALUES (15,4,'นมถั่วเหลือง',15,1);
INSERT INTO "ItemOption" VALUES (16,4,'นมโอ๊ต',20,1);
INSERT INTO "ItemOption" VALUES (17,5,'shot กาแฟ',20,1);
INSERT INTO "ItemOption" VALUES (18,5,'วิปครีม',10,1);
INSERT INTO "ItemOption" VALUES (19,5,'โอรีโอ้',10,1);
INSERT INTO "ItemOption" VALUES (20,6,'วนิลา',10,1);
INSERT INTO "ItemOption" VALUES (21,6,'ส้ม',10,1);
INSERT INTO "ItemOption" VALUES (22,6,'คาราเมล',10,1);
INSERT INTO "ItemOption" VALUES (23,6,'น้ำผึ้ง',10,1);
INSERT INTO "Menu" VALUES (1,1,'เอสเปรสโซ่','espresso.jpg',1,50,NULL);
INSERT INTO "Menu" VALUES (2,1,'อเมริกาโน่','americano.png',1,75,NULL);
INSERT INTO "Menu" VALUES (3,1,'คาปูชิโน่','capuchino.png',1,60,NULL);
INSERT INTO "Menu" VALUES (4,1,'ลาเต้','latte.jpeg',1,55,NULL);
INSERT INTO "Menu" VALUES (5,1,'มอคค่า','mocca.png',1,45,NULL);
INSERT INTO "Menu" VALUES (6,2,'ชาเขียวมัทฉะ','espresso.jpg',1,80,NULL);
INSERT INTO "Menu" VALUES (7,2,'ชาไทย','americano.png',1,50,NULL);
INSERT INTO "Menu" VALUES (8,2,'ชามะนาว','capuchino.png',1,45,NULL);
INSERT INTO "Menu" VALUES (9,2,'ชาอู่หลง','latte.jpeg',1,75,NULL);
INSERT INTO "Menu" VALUES (10,2,'ชาดำเย็น','mocca.png',1,65,NULL);
INSERT INTO "Menu" VALUES (11,3,'นมสดเย็น','espresso.jpg',1,60,NULL);
INSERT INTO "Menu" VALUES (12,3,'นมชมพู','americano.png',1,35,NULL);
INSERT INTO "Menu" VALUES (13,3,'โกโก้เย็น','capuchino.png',1,60,NULL);
INSERT INTO "Menu" VALUES (14,3,'ไมโล','latte.jpeg',1,55,NULL);
INSERT INTO "Menu" VALUES (15,3,'นมคาราเมล','mocca.png',1,45,NULL);
INSERT INTO "Menu" VALUES (16,4,'น้ำผักผลไม้รวม','espresso.jpg',1,85,NULL);
INSERT INTO "Menu" VALUES (17,4,'น้ำส้มคั้นสด','americano.png',1,90,NULL);
INSERT INTO "Menu" VALUES (18,4,'สมูทตี้เบอร์รี่','capuchino.png',1,105,NULL);
INSERT INTO "Menu" VALUES (19,4,'น้ำมะพร้าว','latte.jpeg',1,120,NULL);
INSERT INTO "Menu" VALUES (20,4,'ชาขิงร้อน','mocca.png',1,85,NULL);
INSERT INTO "Menu" VALUES (21,5,'เค้กช็อกโกแลต','espresso.jpg',1,75,NULL);
INSERT INTO "Menu" VALUES (22,5,'ชีสเค้ก','americano.png',1,65,NULL);
INSERT INTO "Menu" VALUES (23,5,'ครัวซองต์','capuchino.png',1,50,NULL);
INSERT INTO "Menu" VALUES (24,5,'โดนัท','latte.jpeg',1,75,NULL);
INSERT INTO "Menu" VALUES (25,5,'มาการอง','mocca.png',1,40,NULL);
INSERT INTO "Menu" VALUES (26,1,'แฟรตไวท์','espresso.jpg',1,65,NULL);
INSERT INTO "Menu" VALUES (27,1,'คาราเมลมัคคิอาโต้','americano.png',1,70,NULL);
INSERT INTO "Menu" VALUES (28,2,'ชาเอิร์ลเกรย์','capuchino.png',1,75,NULL);
INSERT INTO "Menu" VALUES (29,2,'ชาดอกเก๊กฮวย','latte.jpeg',1,55,NULL);
INSERT INTO "Menu" VALUES (30,3,'นมวนิลา','mocca.png',1,60,NULL);
INSERT INTO "Menu" VALUES (31,3,'ช็อกโกแลตมิ้นต์','espresso.jpg',1,75,NULL);
INSERT INTO "Menu" VALUES (32,4,'น้ำแตงโมปั่น','americano.png',1,50,NULL);
INSERT INTO "Menu" VALUES (33,4,'เลมอนโซดา','capuchino.png',1,85,NULL);
INSERT INTO "Menu" VALUES (34,5,'บราวนี่','latte.jpeg',1,90,NULL);
INSERT INTO "Menu" VALUES (35,5,'ทาร์ตผลไม้','mocca.png',1,100,NULL);
INSERT INTO "Menu_OptionGroup" VALUES (1,1,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (2,1,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (3,1,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (4,1,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (5,1,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (6,1,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (7,2,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (8,2,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (9,2,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (10,2,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (11,2,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (12,2,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (13,3,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (14,3,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (15,3,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (16,3,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (17,3,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (18,3,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (19,4,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (20,4,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (21,4,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (22,4,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (23,4,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (24,4,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (25,5,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (26,5,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (27,5,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (28,5,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (29,5,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (30,5,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (31,6,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (32,6,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (33,6,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (34,6,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (35,6,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (36,6,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (37,7,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (38,7,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (39,7,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (40,7,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (41,7,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (42,7,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (43,8,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (44,8,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (45,8,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (46,8,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (47,8,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (48,8,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (49,9,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (50,9,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (51,9,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (52,9,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (53,9,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (54,9,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (55,10,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (56,10,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (57,10,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (58,10,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (59,10,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (60,10,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (61,11,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (62,11,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (63,11,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (64,11,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (65,11,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (66,11,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (67,12,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (68,12,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (69,12,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (70,12,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (71,12,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (72,12,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (73,13,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (74,13,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (75,13,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (76,13,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (77,13,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (78,13,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (79,14,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (80,14,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (81,14,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (82,14,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (83,14,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (84,14,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (85,15,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (86,15,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (87,15,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (88,15,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (89,15,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (90,15,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (91,16,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (92,16,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (93,16,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (94,16,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (95,16,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (96,16,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (97,17,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (98,17,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (99,17,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (100,17,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (101,17,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (102,17,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (103,18,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (104,18,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (105,18,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (106,18,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (107,18,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (108,18,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (109,19,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (110,19,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (111,19,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (112,19,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (113,19,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (114,19,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (115,20,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (116,20,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (117,20,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (118,20,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (119,20,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (120,20,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (121,21,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (122,22,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (123,23,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (124,24,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (125,25,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (126,26,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (127,26,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (128,26,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (129,26,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (130,26,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (131,26,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (132,27,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (133,27,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (134,27,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (135,27,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (136,27,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (137,27,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (138,28,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (139,28,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (140,28,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (141,28,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (142,28,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (143,28,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (144,29,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (145,29,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (146,29,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (147,29,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (148,29,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (149,29,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (150,30,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (151,30,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (152,30,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (153,30,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (154,30,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (155,30,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (156,31,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (157,31,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (158,31,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (159,31,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (160,31,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (161,31,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (162,32,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (163,32,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (164,32,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (165,32,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (166,32,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (167,32,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (168,33,1,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (169,33,2,1,2);
INSERT INTO "Menu_OptionGroup" VALUES (170,33,3,1,3);
INSERT INTO "Menu_OptionGroup" VALUES (171,33,4,0,4);
INSERT INTO "Menu_OptionGroup" VALUES (172,33,5,0,5);
INSERT INTO "Menu_OptionGroup" VALUES (173,33,6,0,6);
INSERT INTO "Menu_OptionGroup" VALUES (174,34,0,1,1);
INSERT INTO "Menu_OptionGroup" VALUES (175,35,0,1,1);
INSERT INTO "OptionGroup" VALUES (0,'',0,0,0);
INSERT INTO "OptionGroup" VALUES (1,'ขนาดแก้ว',1,1,1);
INSERT INTO "OptionGroup" VALUES (2,'ประเภทเครื่องดื่ม',1,1,2);
INSERT INTO "OptionGroup" VALUES (3,'ความหวาน',1,1,3);
INSERT INTO "OptionGroup" VALUES (4,'นม',0,1,4);
INSERT INTO "OptionGroup" VALUES (5,'ท้อปปิ้ง',0,3,5);
INSERT INTO "OptionGroup" VALUES (6,'ไซรัป',0,3,6);
COMMIT;
