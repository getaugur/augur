import Image from "next/image";

export default function MediaCard({
  image,
  title,
  tags,
}: {
  image: string;
  title: string;
  tags: string[];
}) {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <Image src={image} alt="Shoes" width={400} height={255} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {title}
          {/* <div className="badge badge-secondary">NEW</div> */}
        </h2>
        {/* <p>If a dog chews shoes whose shoes does he choose?</p> */}
        {/* <div className="card-actions justify-end">
          {tags.map((tag, i) => (
            <div key={i} className="badge badge-outline">
              {tag}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}
