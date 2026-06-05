/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

// 1. Định nghĩa các kiểu dữ liệu (Interface) chuẩn Strapi v5
interface ProductBet {
  documentId: string;
  id: number;
  name: string;
  price: number;
  team1: string;
  team2: string;
  bet: string;
  notes?: string;
}

interface StrapiData {
  id: number;
  documentId: string;
  name: string;
}

// Tự động nhận diện URL: Nếu chạy local thì dùng localhost, nếu chạy production thì dùng Render
const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  "https://my-strapi-backend-484u.onrender.com";

const PRODUCTS_API = `${STRAPI_BASE_URL}/api/products`;
const TEAMS_API = `${STRAPI_BASE_URL}/api/teams?pagination[limit]=100`;
const BET_TYPES_API = `${STRAPI_BASE_URL}/api/bet-types`;

export default function CRUDPage() {
  const [products, setProducts] = useState<ProductBet[]>([]);

  // Các mảng chứa dữ liệu ĐỘNG gọi từ Strapi về đổ vào các thẻ <select>
  const [dynamicTeams, setDynamicTeams] = useState<StrapiData[]>([]);
  const [dynamicBets, setDynamicBets] = useState<StrapiData[]>([]);

  // State quản lý dữ liệu Form nhập liệu
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [bet, setBet] = useState("");
  const [notes, setNotes] = useState("");

  // State phục vụ cho chức năng Sửa (Update) bằng documentId của Strapi v5
  const [editingId, setEditingId] = useState<string | null>(null);

  // Hàm lấy danh sách Trận đấu/Sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCTS_API, { cache: "no-store" });
      const resData = await res.json();
      setProducts(resData.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu trận đấu:", error);
    }
  };

  // Hàm lấy danh sách các Đội bóng và các Loại kèo từ Strapi
  const fetchFormOptions = async () => {
    try {
      const [teamsRes, betsRes] = await Promise.all([
        fetch(TEAMS_API, { cache: "no-store" }),
        fetch(BET_TYPES_API, { cache: "no-store" }),
      ]);

      const teamsData = await teamsRes.json();
      const betsData = await betsRes.json();

      setDynamicTeams(teamsData.data || []);
      setDynamicBets(betsData.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách lựa chọn động từ Strapi:", error);
    }
  };

  // Chạy ngay khi tải trang và thiết lập tự động cập nhật dữ liệu từ điện thoại
  useEffect(() => {
    fetchProducts();
    fetchFormOptions();

    // 🔄 Tự động đồng bộ: Cứ mỗi 5 giây hệ thống âm thầm gọi API lấy dữ liệu mới
    // Giúp bạn nhập trên điện thoại thì máy tính tự động cập nhật ngay lập tức
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Xóa trắng form (Reset)
  const resetForm = () => {
    setName("");
    setPrice("");
    setTeam1("");
    setTeam2("");
    setBet("");
    setNotes("");
    setEditingId(null);
  };

  // Chức năng Thêm mới hoặc Sửa dữ liệu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || !team1 || !team2 || !bet) {
      return alert("Vui lòng điền và chọn đầy đủ thông tin!");
    }

    if (team1 === team2) {
      return alert("Đội 1 và Đội 2 không được trùng nhau!");
    }

    const payload = {
      data: { name, price: Number(price), team1, team2, bet, notes },
    };

    try {
      if (editingId) {
        await fetch(`${PRODUCTS_API}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(PRODUCTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
    }
  };

  // Đổ dữ liệu cũ vào Form khi ấn nút "Sửa"
  const handleEdit = (product: ProductBet) => {
    setEditingId(product.documentId);
    setName(product.name);
    setPrice(product.price.toString());
    setTeam1(product.team1);
    setTeam2(product.team2);
    setBet(product.bet);
    setNotes(product.notes || "");
  };

  // Chức năng Xóa dựa trên documentId của Strapi v5
  const handleDelete = async (documentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục này?")) return;

    try {
      await fetch(`${PRODUCTS_API}/${documentId}`, { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          MANAGER
        </h1>

        {/* 🌟 ĐÃ THAY ĐỔI: Sử dụng Grid chia 3 cột cố định từ màn hình md (máy tính/tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* CỘT 1: FORM NHẬP LIỆU (Chiếm 5 phần) */}
          <div className="col-span-1 md:col-span-5 bg-zinc-800 p-6 rounded-none border border-zinc-700 md:sticky md:top-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-emerald-400 border-b border-zinc-700 pb-2">
              {editingId ? "Update match" : "Bet form"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Name user
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                  placeholder="Enter the name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SELECT CHỌN ĐỘI A */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Team A
                  </label>
                  <select
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                  >
                    <option value="">team a</option>
                    {dynamicTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SELECT CHỌN ĐỘI B */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Team B
                  </label>
                  <select
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                  >
                    <option value="">team b</option>
                    {dynamicTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELECT CHỌN KÈO */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  bet
                </label>
                <select
                  value={bet}
                  onChange={(e) => setBet(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                >
                  <option value="">set bet</option>
                  {dynamicBets.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  note
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all resize-none"
                  placeholder="vd: đặt Bồ, Bồ chấp 1.5 "
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  money
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                  placeholder="Enter the amount"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 text-zinc-900 text-sm font-bold py-3 transition-all shadow-md transform active:scale-95 ${
                    editingId
                      ? "bg-amber-400 hover:bg-amber-500"
                      : "bg-emerald-400 hover:bg-emerald-500"
                  }`}
                >
                  {editingId ? "update..." : "confirm"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 bg-zinc-700 text-zinc-300 text-sm font-medium py-3 hover:bg-zinc-600 transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* CỘT 2: DANH SÁCH HIỂN THỊ (Chiếm 7 phần) */}
          <div className="col-span-1 md:col-span-7 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-700 pb-2">
              <h2 className="text-xl font-semibold text-zinc-300">
                match now ({products.length})
              </h2>
            </div>

            {products.length === 0 ? (
              <div className="text-zinc-500 bg-zinc-800/50 p-12 rounded-none border border-dashed border-zinc-700 text-center text-sm">
                no data
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-zinc-800 p-5 rounded-none border border-zinc-700/60 shadow-sm flex flex-col justify-between hover:border-zinc-500 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-xs font-mono text-zinc-500">
                          ID: {product.id}
                        </span>
                        <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                          ${product.price}
                        </span>
                      </div>

                      <h3 className="font-bold text-zinc-100 text-base mb-3">
                        {product.name}
                      </h3>

                      <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-700/40 text-xs mb-4">
                        <p className="text-zinc-400 flex justify-between">
                          <span>Đội 1:</span>{" "}
                          <span className="font-semibold text-zinc-200">
                            {product.team1}
                          </span>
                        </p>
                        <p className="text-zinc-400 flex justify-between">
                          <span>Đội 2:</span>{" "}
                          <span className="font-semibold text-zinc-200">
                            {product.team2}
                          </span>
                        </p>
                        <p className="text-zinc-400 flex justify-between border-t border-zinc-800 pt-1.5 mt-1.5">
                          <span>Loại kèo:</span>{" "}
                          <span className="font-semibold text-blue-400">
                            {product.bet}
                          </span>
                        </p>
                        {product.notes && (
                          <div className="text-zinc-400 flex justify-between items-start border-t border-zinc-800/60 pt-1.5 mt-1.5">
                            <span className="shrink-0 text-zinc-500">
                              Ghi chú:
                            </span>
                            <span className="font-medium text-zinc-300 italic max-w-[70%] text-right break-words">
                              {product.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-3 border-zinc-700/60">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 text-center text-xs font-medium text-amber-400 bg-amber-500/10 py-2 rounded-xl hover:bg-amber-500/20 transition-all border border-amber-500/20"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(product.documentId)}
                        className="flex-1 text-center text-xs font-medium text-red-400 bg-red-500/10 py-2 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
